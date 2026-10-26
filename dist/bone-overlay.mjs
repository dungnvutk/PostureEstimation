import {JOINT_MIN} from './pose-quality.mjs';
// Original anatomical illustration geometry. Landmarks anchor each articulated segment.
export const artworkReady=Promise.resolve();
export function drawBones(ctx,landmarks,width,height,opacity=.9,showJoints=false){
 const p=landmarks.map(v=>({...v,x:v.x*width,y:v.y*height}));
 const good=(...ids)=>ids.every(i=>p[i]?.visibility>=JOINT_MIN&&Number.isFinite(p[i].x)&&Number.isFinite(p[i].y));
 const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const shoulder=good(11,12)?dist(p[11],p[12]):width*.12;
 ctx.save();ctx.globalAlpha=opacity;ctx.lineCap='round';ctx.lineJoin='round';
 function bone(a,b,kind,offset=0,thin=1){
  if(!good(a,b))return;
  const len=dist(p[a],p[b]);if(len<2)return;
  const radius=Math.max(1.5,Math.min(len*.075,shoulder*.07))*thin;
  ctx.save();ctx.translate(p[a].x,p[a].y);ctx.rotate(Math.atan2(p[b].y-p[a].y,p[b].x-p[a].x));ctx.translate(0,offset*radius);ctx.scale(len,radius);
  const g=ctx.createLinearGradient(0,-1,0,1);g.addColorStop(0,'#a4afb2');g.addColorStop(.3,'#f4f6ee');g.addColorStop(.55,'#dce2dd');g.addColorStop(1,'#73858a');ctx.fillStyle=g;
  ctx.beginPath();
  if(kind==='femur'){
   ctx.moveTo(0,-.2);ctx.bezierCurveTo(-.015,-.85,.04,-1.05,.075,-.7);ctx.lineTo(.13,.12);ctx.bezierCurveTo(.38,.4,.65,.18,.86,.08);ctx.bezierCurveTo(.93,-.9,1.03,-.95,1.015,-.1);ctx.bezierCurveTo(1.05,.65,.96,1.1,.89,.7);ctx.bezierCurveTo(.64,.5,.38,.9,.15,.65);ctx.lineTo(.065,.05);ctx.quadraticCurveTo(.02,.4,0,-.2);
  }else{
   ctx.moveTo(0,-.2);ctx.bezierCurveTo(-.02,-1,.065,-1.12,.11,-.65);ctx.bezierCurveTo(.25,-.15,.68,-.25,.87,-.45);ctx.bezierCurveTo(.95,-.85,1.02,-.65,1,-.05);ctx.bezierCurveTo(1.02,.8,.93,.95,.87,.55);ctx.bezierCurveTo(.63,.22,.3,.35,.12,.62);ctx.bezierCurveTo(.04,1,-.025,.7,0,-.2);
  }ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(.16,-.03);ctx.bezierCurveTo(.4,-.05,.65,-.05,.86,-.12);ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=.1;ctx.stroke();ctx.restore();
 }
 // Paired radius/ulna and tibia/fibula, each anchored to the same joint endpoints.
 for(const [a,b]of [[11,13],[12,14]])bone(a,b,'humerus');
 for(const [a,b]of [[13,15],[14,16]]){bone(a,b,'radius',-.85,.55);bone(a,b,'ulna',.95,.45)}
 for(const [a,b]of [[23,25],[24,26]])bone(a,b,'femur');
 for(const [a,b]of [[25,27],[26,28]]){bone(a,b,'tibia',-.25,.85);bone(a,b,'fibula',1.6,.28)}
 for(const [a,b]of [[15,19],[16,20],[27,31],[28,32]]){bone(a,b,'small',-.8,.4);bone(a,b,'small',.8,.4)}
 function line(points,w=2){ctx.beginPath();points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.strokeStyle='rgba(36,58,65,.65)';ctx.lineWidth=w+1.5;ctx.stroke();ctx.strokeStyle='#e4eae3';ctx.lineWidth=w;ctx.stroke()}
 if(good(11,12,23,24)){
  const s=mid(p[11],p[12]),h=mid(p[23],p[24]);const sx=p[12].x-p[11].x,sy=p[12].y-p[11].y,vx=h.x-s.x,vy=h.y-s.y;
  const q=(x,y)=>({x:s.x+sx*x+vx*y,y:s.y+sy*x+vy*y});const thickness=Math.max(1.1,Math.min(shoulder,dist(s,h))*.025);
  function curve(coords,w){ctx.beginPath();const start=q(...coords[0]);ctx.moveTo(start.x,start.y);for(let i=1;i<coords.length;i+=3){const a=q(...coords[i]),b=q(...coords[i+1]),c=q(...coords[i+2]);ctx.bezierCurveTo(a.x,a.y,b.x,b.y,c.x,c.y)}ctx.strokeStyle='rgba(35,53,59,.65)';ctx.lineWidth=w+1.2;ctx.stroke();ctx.strokeStyle='#e9eee5';ctx.lineWidth=w;ctx.stroke()}
  // Cervical / thoracic / lumbar vertebrae with individual transverse processes.
  for(let i=0;i<17;i++){const y=-.12+i*.064,span=y>.6?.045:.035;line([q(-span,y),q(span,y)],thickness*1.5);line([q(0,y-.016),q(0,y+.016)],thickness*2)}
  curve([[-.49,0],[-.3,-.025],[-.15,.065],[0,.035],[.15,.065],[.3,-.025],[.49,0]],thickness*1.6);
  // Sweeping costal arcs taper toward the costal margin.
  for(let i=0;i<9;i++){const y=.09+i*.049,extent=.19+Math.sin((i+1)/10*Math.PI)*.17;for(const side of [-1,1])curve([[side*.035,y],[side*extent*.7,y-.075],[side*extent*1.2,y-.02],[side*extent,y+.09],[side*extent*.8,y+.16],[side*.12,y+.18],[side*.025,y+.15]],thickness)}
  line([q(0,.075),q(0,.43)],thickness*2.2);
  // Iliac wings, sacrum and open obturator foramina instead of a geometric hip ring.
  ctx.save();ctx.transform(sx,sy,vx,vy,s.x,s.y);
  for(const side of [-1,1]){ctx.save();ctx.scale(side,1);const g=ctx.createLinearGradient(.03,.8,.45,1);g.addColorStop(0,'#a6b4b6');g.addColorStop(.55,'#e8eee3');g.addColorStop(1,'#87999d');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(.025,.84);ctx.bezierCurveTo(.1,.81,.24,.72,.37,.79);ctx.bezierCurveTo(.43,.83,.42,.96,.33,1.015);ctx.bezierCurveTo(.3,1.05,.22,1.1,.12,1.12);ctx.bezierCurveTo(.025,1.1,.03,1.01,.025,.84);ctx.closePath();ctx.moveTo(.13,.97);ctx.bezierCurveTo(.22,.93,.29,.98,.23,1.05);ctx.bezierCurveTo(.17,1.1,.09,1.05,.13,.97);ctx.fill('evenodd');ctx.restore()}
  ctx.fillStyle='#d9e2dc';ctx.beginPath();ctx.moveTo(-.07,.81);ctx.lineTo(.07,.81);ctx.quadraticCurveTo(.075,.96,0,1.025);ctx.quadraticCurveTo(-.075,.96,-.07,.81);ctx.fill();ctx.restore();
  // Patellae sit on the detected knee joints.
  for(const i of [25,26])if(good(i)){ctx.fillStyle='#e8ece1';ctx.beginPath();ctx.ellipse(p[i].x,p[i].y,thickness*1.8,thickness*2.3,0,0,Math.PI*2);ctx.fill()}
 }
 if(good(0,11,12)){
  const s=mid(p[11],p[12]),eyes=good(2,5)?mid(p[2],p[5]):p[0];
  const size=Math.max(8,Math.min(good(7,8)?Math.max(dist(p[7],p[8])*1.25,shoulder*.28):shoulder*.32,dist(s,eyes)*.8));
  ctx.save();ctx.translate(eyes.x,eyes.y);let roll=0;if(good(2,5)&&dist(p[2],p[5])>size*.12){const left=p[2].x<p[5].x?p[2]:p[5],right=left===p[2]?p[5]:p[2];roll=Math.atan2(right.y-left.y,right.x-left.x)}ctx.rotate(roll);ctx.scale(size,size);
  // Fine anatomical contour drawing, leaving the video visible through the skull.
  const vault=new Path2D('M -.42 -.02 C -.47 -.19 -.43 -.43 -.28 -.57 C -.15 -.69 .13 -.7 .29 -.56 C .43 -.44 .47 -.21 .42 -.02 C .39 .06 .37 .12 .31 .16 M -.42 -.02 C -.39 .06 -.37 .12 -.31 .16');
  ctx.fillStyle='rgba(221,232,226,.12)';ctx.strokeStyle='rgba(225,237,231,.95)';ctx.lineWidth=.018;
  ctx.fill(vault);ctx.stroke(vault);
  function contour(d,alpha=.8,weight=.012){ctx.strokeStyle=`rgba(217,233,229,${alpha})`;ctx.lineWidth=weight;ctx.stroke(new Path2D(d))}
  // Temporal lines and zygomatic arches.
  contour('M -.35 -.37 C -.4 -.24 -.34 -.13 -.32 -.08 M .35 -.37 C .4 -.24 .34 -.13 .32 -.08',.65);
  contour('M -.42 -.015 L -.36 .075 L -.29 .095 L -.245 .205 M .42 -.015 L .36 .075 L .29 .095 L .245 .205');
  // Angular orbital margins use transparent interiors, without dark circular sockets.
  contour('M -.325 -.065 Q -.245 -.115 -.105 -.065 L -.09 .02 L -.155 .085 Q -.26 .105 -.31 .04 Z M .325 -.065 Q .245 -.115 .105 -.065 L .09 .02 L .155 .085 Q .26 .105 .31 .04 Z',.72,.01);
  // Nasal bridge and maxilla.
  contour('M -.045 -.07 L -.035 .08 L -.065 .15 M .045 -.07 L .035 .08 L .065 .15 M -.065 .15 Q 0 .185 .065 .15',.64,.009);
  contour('M -.245 .205 L -.16 .235 L .16 .235 L .245 .205 M -.19 .12 L -.175 .195 M .19 .12 L .175 .195',.67,.01);
  // Mandibular rami, angle and chin; no decorative teeth or smiling curve.
  contour('M -.31 .105 L -.3 .3 Q -.285 .355 -.18 .395 L -.09 .425 L .09 .425 L .18 .395 Q .285 .355 .3 .3 L .31 .105',.95,.018);
  contour('M -.23 .175 L -.23 .29 L -.13 .345 L .13 .345 L .23 .29 L .23 .175',.6,.009);
  // Subtle coronal and sagittal sutures.
  contour('M -.32 -.49 L -.22 -.455 L -.16 -.47 L -.08 -.445 L 0 -.46 L .08 -.445 L .16 -.47 L .22 -.455 L .32 -.49 M 0 -.645 L -.014 -.61 L .012 -.57 L -.01 -.53 L 0 -.46',.38,.007);
  ctx.restore();
 }
 if(showJoints)for(let i=11;i<p.length;i++){if(!good(i))continue;ctx.beginPath();ctx.arc(p[i].x,p[i].y,Math.max(2,width/280),0,Math.PI*2);ctx.fillStyle='#68d9eb';ctx.fill();ctx.strokeStyle='#183c49';ctx.lineWidth=1;ctx.stroke()}
 ctx.restore();
}
