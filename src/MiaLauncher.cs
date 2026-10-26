using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Reflection;
using System.Threading;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;

[assembly: AssemblyTitle("Mia")]
[assembly: AssemblyDescription("Walking posture and silhouette analysis")]
[assembly: AssemblyVersion("1.3.1.0")]
class Mia {
    static TcpListener server;
    static volatile bool running = true;
    static string address;
    static byte[] Asset(string name) {
        using (Stream s = Assembly.GetExecutingAssembly().GetManifestResourceStream(name)) {
            if (s == null) throw new FileNotFoundException(name);
            using (MemoryStream m = new MemoryStream()) { s.CopyTo(m); return m.ToArray(); }
        }
    }
    static void Serve(object state) {
        using (TcpClient client = (TcpClient)state) {
            try {
                client.ReceiveTimeout = 5000; client.SendTimeout = 5000;
                using (NetworkStream stream = client.GetStream()) {
                    string first;
                    using (StreamReader reader = new StreamReader(stream, Encoding.ASCII, false, 1024, true)) {
                        first = reader.ReadLine(); string line; int count = 0;
                        while (!string.IsNullOrEmpty(line = reader.ReadLine())) { if (++count > 100 || line.Length > 8192) return; }
                    }
                    if (first == null) return;
                    string[] parts = first.Split(' ');
                    if (parts.Length < 2) return;
                    string path = parts[1].Split('?')[0];
                    string name = path == "/" ? "index.html" : path.TrimStart('/');
                    if (Array.IndexOf(Assembly.GetExecutingAssembly().GetManifestResourceNames(), name) < 0) name = null;
                    bool ok = name != null && (parts[0] == "GET" || parts[0] == "HEAD");
                    byte[] body = ok ? Asset(name) : Encoding.UTF8.GetBytes("Not found");
                    string type = name != null && (name.EndsWith(".js") || name.EndsWith(".mjs")) ? "text/javascript" : name != null && name.EndsWith(".wasm") ? "application/wasm" : name != null && name.EndsWith(".task") ? "application/octet-stream" : name != null && name.EndsWith(".svg") ? "image/svg+xml" : name == "style.css" ? "text/css" : "text/html";
                    byte[] header = Encoding.ASCII.GetBytes("HTTP/1.1 " + (ok ? "200 OK" : "404 Not Found") + "\r\nContent-Type: " + type + "; charset=utf-8\r\nContent-Length: " + body.Length + "\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n");
                    stream.Write(header, 0, header.Length);
                    if (parts[0] != "HEAD") stream.Write(body, 0, body.Length);
                }
            } catch (IOException) { } catch (SocketException) { }
        }
    }
    static void Listen() {
        while (running) {
            try { ThreadPool.QueueUserWorkItem(Serve, server.AcceptTcpClient()); }
            catch (SocketException) { if (!running) return; }
            catch (ObjectDisposedException) { return; }
        }
    }
    static void Open() {
        try { Process.Start(new ProcessStartInfo(address) { UseShellExecute = true }); }
        catch (Exception e) { MessageBox.Show("Open this address in Chrome or Edge:\n" + address + "\n\n" + e.Message, "Mia"); }
    }
    [STAThread] static int Main(string[] args) {
        bool test = args.Length == 2 && args[0] == "--self-test";
        try {
            server = new TcpListener(IPAddress.Loopback, 0); server.Start();
            address = "http://127.0.0.1:" + ((IPEndPoint)server.LocalEndpoint).Port + "/";
            Thread worker = new Thread(Listen); worker.IsBackground = true; worker.Start();
            if (test) {
                using (WebClient wc = new WebClient()) {
                    wc.Proxy = null;
                    foreach (string name in Assembly.GetExecutingAssembly().GetManifestResourceNames()) {
                        byte[] expected = Asset(name);
                        byte[] actual = wc.DownloadData(address + (name == "index.html" ? "" : name));
                        if (Convert.ToBase64String(expected) != Convert.ToBase64String(actual)) throw new Exception("Asset mismatch: " + name);
                    }
                    try { wc.DownloadData(address + "../README.md"); throw new Exception("Unexpected file access"); }
                    catch (WebException ex) { if (((HttpWebResponse)ex.Response).StatusCode != HttpStatusCode.NotFound) throw; }
                }
                File.WriteAllText(args[1], "PASS: standalone EXE started; all embedded app assets served exactly; unknown paths rejected.");
                return 0;
            }
            Application.EnableVisualStyles();
            Form form = new Form(); form.Text = "Mia — Running"; form.ClientSize = new Size(440, 230);
            form.StartPosition = FormStartPosition.CenterScreen; form.FormBorderStyle = FormBorderStyle.FixedDialog; form.MaximizeBox = false;
            form.BackColor = Color.FromArgb(245,246,242); form.Font = new Font("Segoe UI", 10);
            Label title = new Label(); title.Text = "Mia is ready."; title.Font = new Font("Segoe UI", 20, FontStyle.Bold); title.SetBounds(25,20,390,45);
            Label info = new Label(); info.Text = "The app opens in your browser. Keep this window open\nwhile analyzing videos. Close it to stop Mia.\n\nDetection model included. Works offline."; info.SetBounds(27,74,390,90);
            Button open = new Button(); open.Text = "Open Mia"; open.SetBounds(27,175,180,35); open.Click += delegate { Open(); };
            Button quit = new Button(); quit.Text = "Quit"; quit.SetBounds(225,175,180,35); quit.Click += delegate { form.Close(); };
            form.Controls.AddRange(new Control[] {title, info, open, quit}); form.Shown += delegate { Open(); };
            Application.Run(form); return 0;
        } catch (Exception e) {
            if (test) File.WriteAllText(args[1], "FAIL: " + e);
            else MessageBox.Show("Mia could not start.\n\n" + e.Message, "Mia");
            return 1;
        } finally { running = false; if (server != null) server.Stop(); }
    }
}
