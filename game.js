import './world3d.js';
(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const scenes = {
    flat: {label:"THE FLAT",image:"room.png",spots:[
      ["bed","BED",17,64],["desk","DESK",34,45],["bathroom","BATHROOM",50,28],
      ["door","FRONT DOOR",55,48],["kitchen","KITCHEN",61,73],["wardrobe","WARDROBE",83,45]]},
    bed:{label:"BEDSIDE",image:"bed-close.png",spots:[["phone","PHONE",27,72],["bedclothes","BED",58,63],["gym","GYM BAG",82,73]]},
    desk:{label:"AT THE DESK",image:"desk-close.png",spots:[["computer","COMPUTER",47,43],["window","WINDOW",14,34],["chair","CHAIR",72,77]]},
    wardrobe:{label:"WARDROBE",image:"wardrobe-close.png",spots:[["clothes","CLOTHES",38,43],["mirror","MIRROR",76,44],["parcel","PARCEL",40,75]]},
    bathroom:{label:"BATHROOM",image:"bathroom.png",spots:[["sink","SINK",35,60],["shower","SHOWER",63,51]]},
    kitchen:{label:"KITCHEN",image:"kitchen.png",spots:[["dishes","DISHES",42,56],["food","FOOD",67,48],["trash","TRASH",20,79]]},
    door:{label:"THE DOOR",image:"doorway.png",spots:[["exit","DOOR HANDLE",52,48]]}
  };
  const fresh = () => ({
    startedAt:new Date().toISOString(),stage:0,scene:"flat",actions:0,minutes:0,outfit:"oversized black shirt",
    phoneRead:false,showered:false,genderSeen:false,migrated:false,answered:false,photoSent:false,
    cared:0,explored:0,scrutiny:0,avoidance:0,connection:0,masc:0,compulsions:0,
    measurements:{jaw:0,shoulder:0,frame:0},visits:{},computerVisits:{},flags:{},log:[],ending:null
  });
  let s=fresh(), thoughtTimer, toastTimer, activeApp=null, actionBusy=false, markerBusy=false, timeDecision=false;
  const asset=name=>""+name.replace(/\.png$/,".webp");
  const retroCache=new Map(),retroAsset=name=>retroCache.get(name)||asset(name);
  ["room-chair-clothes.png","room.png","bed-close.png","bed-made.png","desk-close.png","chair-clothes.png","wardrobe-close.png","doorway.png","bathroom.png","shower-running.png","brush-teeth.png","kitchen.png","kitchen-clean.png","mirror-close.png","mirror-close-plum.png","mirror-close-hoodie.png","mirror-visible.png","avatar-strip.png"].forEach(name=>{
    const img=new Image();img.onload=()=>{try{const c=document.createElement("canvas");c.width=256;c.height=Math.round(256*img.naturalHeight/img.naturalWidth);const g=c.getContext("2d");g.drawImage(img,0,0,c.width,c.height);retroCache.set(name,c.toDataURL("image/png"));if(name==="room-chair-clothes.png")$(".intro-image").style.backgroundImage=`url('${retroCache.get(name)}')`;}catch{}};img.src=asset(name);
  });
  const esc = x => String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function record(type,detail={}) {
    s.log.push({at:clock(),type,...detail});
    try{localStorage.setItem("passing-session-v3",JSON.stringify(s));}catch{}
  }
  function clock(){let n=19*60+20+Math.floor(s.minutes);return `${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`}
  function updateTime(){
    const left=40-s.minutes;
    $("#clock").textContent=clock();$("#computer-time").textContent=clock();$("#mirror-clock").textContent=clock();
    $("#time-left").textContent=left>0?`${Math.ceil(left)} MIN TO MEETING`:"ALEX IS WAITING";
    $("#play").classList.toggle("time-urgent",left<=10);
    if(left<=10&&!s.flags.tenMinuteWarning){s.flags.tenMinuteWarning=true;toast("10 MINUTES UNTIL ALEX · YOU CAN GO TO THE FRONT DOOR NOW");}
    if(left<=0&&!timeDecision){timeDecision=true;setTimeout(()=>{
      if($("#play").classList.contains("hidden"))return;
      panel("20:00 · ALEX IS WAITING","The meeting time is here","You can head to the front door now. The evening will only end when you choose to leave or stay.",[
        ["Go to the front door",()=>{closePanel();$("#computer").classList.add("hidden");$("#mirror-mode").classList.add("hidden");PassingWorld.teleport(3.8,6.2,Math.PI);thought("The front door. I can still go.")}],
        ["I want to stay longer",()=>{closePanel();s.flags.choseToStayLate=true;thought("Alex knows I am still here. I am choosing a little more time.")}]
      ]);
    },actionBusy?1700:300)}
  }
  function act(type,changes={},minutes=2){
    s.actions++;s.minutes=Math.min(99,s.minutes+minutes/4);
    for(const [k,v] of Object.entries(changes)) s[k]+=v;
    record(type,changes);updateTime();
    if(s.actions===11 && !s.answered) thought("Alex is probably looking at the entrance every time it opens.");
    if(s.actions===19 && !s.flags.taylorFollowup) {s.flags.taylorFollowup=true;toast("ALEX: no rush. Just let me know you’re okay.");}
    $("#color-layer").style.setProperty("--warmth",Math.min(.85,(s.cared*.1+s.explored*.09)));
  }
  function thought(t){
    clearTimeout(thoughtTimer);
    const inMirror=!$("#mirror-mode").classList.contains("hidden");
    $("#thought").classList.add("hidden");$("#mirror-thought").classList.add("hidden");
    if(inMirror){$("#mirror-thought").textContent=t;$("#mirror-thought").classList.remove("hidden")}
    else{$("#thought-text").textContent=t;$("#thought").classList.remove("hidden")}
    thoughtTimer=setTimeout(()=>{$("#thought").classList.add("hidden");$("#mirror-thought").classList.add("hidden")},4800);
  }
  function toast(t){clearTimeout(toastTimer);$("#toast").textContent=t;$("#toast").classList.remove("hidden");toastTimer=setTimeout(()=>$("#toast").classList.add("hidden"),4200);}
  function objective(){
    $("#objective").textContent= s.stage===0?"Find your phone":s.stage===1?"Wash up":s.stage===2?"Find something to wear":s.stage===3?"Look in the mirror":"Alex is downstairs. Leave when ready.";
    $("#waypoint").textContent=s.stage===0?"PHONE · BEDROOM":s.stage===1?"SHOWER · BATHROOM":s.stage===2?"CLOTHES · WARDROBE":s.stage===3?"MIRROR · WARDROBE":"FRONT DOOR · THE FLAT";
    PassingWorld.setGoal(s.stage===0?"phone":s.stage===1?"shower":s.stage===2?"clothes":s.stage===3?"mirror":"exit");
  }
  function show(id){["intro","play","ending","debrief"].forEach(x=>$("#"+x).classList.toggle("hidden",x!==id));}
  function sceneImage(name){
    if(name==="flat"&&!s.flags.chairCleared)return "room-chair-clothes.png";
    if(name==="desk"&&!s.flags.chairCleared)return "chair-clothes.png";
    if(name==="bed"&&s.flags.bedMade)return "bed-made.png";
    if(name==="kitchen"&&s.flags.kitchenClean)return "kitchen-clean.png";
    return scenes[name].image;
  }
  const roomKey={"BEDROOM":"bed","THE FLAT":"flat","WARDROBE":"wardrobe","KITCHEN":"kitchen","BATHROOM":"bathroom"};
  function enterRoom(name){
    const key=roomKey[name]||"flat",first=!Object.keys(s.visits).length;
    s.scene=key;s.visits[key]=(s.visits[key]||0)+1;record("move",{place:key,visit:s.visits[key]});
    $("#place").textContent=name;$("#scene-image").src=asset(sceneImage(key));
    if(first)thought("Alex. Eight o’clock. Phone, shower, clothes. I can do that.");
    else if(key==="bathroom"&&s.stage===1)thought("The shower is over there. I can still make it.");
  }
  function closePanel(){$("#panel").classList.add("hidden");$("#panel-content").replaceChildren()}
  function panel(kicker,title,copy,choices=[],extra=""){
    const host=$("#panel-content");host.innerHTML=`<span class="eyebrow">${kicker}</span><h2 id="panel-title">${title}</h2>${extra}<p>${copy}</p><div class="actions"></div>`;
    const actions=host.querySelector(".actions");
    choices.forEach(([label,fn])=>{let b=document.createElement("button");b.textContent=label;b.onclick=fn;actions.append(b)});
    $("#panel").classList.remove("hidden");
  }
  function finishAction(type,changes,line,minutes=2){act(type,changes,minutes);closePanel();thought(line);objective()}
  function physical({type,changes={},line,before,after,kind="tidy",caption="",minutes=2,done,beforeFocus="center",afterFocus=beforeFocus}){
    if(actionBusy)return;
    actionBusy=true;closePanel();
    const v=$("#action-view");
    v.classList.add("hidden");
    const duration=kind==="shower"?1950:kind==="brush"?1500:1150;
    PassingWorld.animate(kind,duration,type);
    act(type,changes,minutes);if(done)done();objective();
    setTimeout(()=>{
      v.classList.add("hidden");v.classList.remove("playing");actionBusy=false;
      $("#scene-image").src=asset(sceneImage(s.scene));PassingWorld.refresh(s.flags);
      thought(line);
    },kind==="shower"?1950:kind==="brush"?1500:1150);
  }
  function interact(item){
    if(actionBusy||!$("#panel").classList.contains("hidden")||!$("#computer").classList.contains("hidden")||!$("#mirror-mode").classList.contains("hidden"))return;
    record("inspect",{object:item});
    ({
      phone,bedclothes,gym,computer,window,chair,clothes,mirror,parcel,sink,shower,dishes,food,trash,exit
    })[item]?.();
  }
  function phone(){
    const first=!s.phoneRead;
    panel("PHONE · ALEX",clock(),
      first?"Still good for eight? I can wait downstairs. We can just walk, if that’s easier.":"Alex’s message is still here. There is room to answer it differently.",
      [
        ["Reply: “I’m getting ready”",()=>{s.phoneRead=true;s.answered=true;s.connection+=2;if(s.stage===0)s.stage=1;finishAction("reply_ready",{},"Sent. Now somebody knows I’m coming.");}],
        ["Reply: “I’m not sure what to wear”",()=>{s.phoneRead=true;s.answered=true;s.connection+=3;if(s.stage===0)s.stage=1;finishAction("reply_honest",{},"The typing indicator appears. Alex: ‘Then wear whatever lets you come downstairs.’");}],
        ["Read it and put the phone down",()=>{s.phoneRead=true;if(s.stage===0)s.stage=1;finishAction("phone_down",{avoidance:1},"I’ve read it. I should wash up.");}]
      ]);
  }
  function shower(){
    physical({type:"shower",changes:{cared:2},line:"Warm water. For a few minutes my body is something I live in.",before:"bathroom.png",after:"shower-running.png",kind:"shower",caption:"The curtain closes. Water starts.",minutes:4,beforeFocus:"65% center",done:()=>{s.showered=true;if(s.stage<=1)s.stage=2}});
  }
  function sink(){physical({type:"brush_teeth",changes:{cared:1},line:"I put the toothbrush down. I can see myself without inspecting every angle.",before:"bathroom.png",after:"brush-teeth.png",kind:"brush",caption:"Brush. Rinse. Breathe.",minutes:2,beforeFocus:"28% center",afterFocus:"40% center"})}
  function clothes(){
    panel("WARDROBE","Something to wear","A black shirt, an oversized hoodie, and a parcel half-hidden beneath them.",[
      ["Put on the black shirt",()=>physical({type:"wear_black",changes:{masc:1},line:"It fits. I keep tugging at the shoulders.",before:"wardrobe-close.png",after:"mirror-close.png",caption:"The shirt catches at the shoulders.",beforeFocus:"45% center",afterFocus:"center",done:()=>{s.outfit="black shirt";if(s.stage<=2)s.stage=3}})],
      ["Wear the oversized hoodie",()=>physical({type:"wear_hoodie",changes:{avoidance:1},line:"Nobody can tell much beneath it. That has always been the point.",before:"wardrobe-close.png",after:"mirror-close-hoodie.png",caption:"I pull the fabric over my hands.",beforeFocus:"45% center",afterFocus:"center",done:()=>{s.outfit="oversized hoodie";if(s.stage<=2)s.stage=3}})],
      ["Open the parcel",parcel]
    ]);
  }
  function parcel(){
    panel("WARDROBE · PARCEL","Ordered at 02:13","A soft plum top, still folded. Nobody else knows it is here.",[
      ["Try it on",()=>physical({type:"try_plum",changes:{explored:3},line:"Oh. I expected embarrassment first. This is something else.",before:"wardrobe-close.png",after:"mirror-close-plum.png",caption:"The sleeves settle over my wrists.",minutes:3,beforeFocus:"45% center",afterFocus:"center",done:()=>{s.outfit="plum top";s.genderSeen=true;if(s.stage<=2)s.stage=3}})],
      ["Hold it against yourself",()=>{s.genderSeen=true;finishAction("hold_plum",{explored:1,avoidance:1},"Close enough to imagine it. Far enough to deny that I did.");}],
      ["Fold it away",()=>finishAction("hide_parcel",{avoidance:2},"The cardboard closes. I remember exactly where I put it.")]
    ]);
  }
  function mirror(){
    s.visits.mirror=(s.visits.mirror||0)+1;
    if(s.stage===3)s.stage=4;
    $("#mirror-photo").src=retroAsset(s.outfit==="plum top"?"mirror-close-plum.png":s.outfit==="oversized hoodie"?"mirror-close-hoodie.png":"mirror-close.png");
    $("#mirror-mode").classList.remove("hidden");
    requestAnimationFrame(resizeMirror);
    record("mirror_open",{visit:s.visits.mirror,outfit:s.outfit});
    if(s.visits.mirror===1)thought("There I am. Smaller than the men I’m told to be.");
    objective();
  }
  const paths={
    jaw:[[.38,.27],[.42,.35],[.48,.39],[.53,.39],[.58,.35],[.62,.27]],
    shoulder:[[.14,.46],[.27,.43],[.42,.43],[.58,.43],[.73,.43],[.86,.46]],
    frame:[[.33,.57],[.35,.62],[.5,.66],[.65,.62],[.67,.57]]
  };
  const labelPoints={jaw:[.57,.31],shoulder:[.54,.46],frame:[.59,.6]};
  function inkName(part){
    return s.migrated?({jaw:"FACIAL DIMORPHISM",shoulder:"CLOCKABILITY",frame:"PASSING RANGE"})[part]:
      ({jaw:"JAW DEFINITION",shoulder:"SHOULDER RATIO",frame:"FRAME"})[part];
  }
  function resizeMirror(){
    const c=$("#mirror-ink"),d=globalThis.devicePixelRatio||1;
    c.width=Math.round(innerWidth*d);c.height=Math.round(innerHeight*d);
    c.getContext("2d").setTransform(d,0,0,d,0,0);renderMarks();
  }
  function drawInk(part,progress=1){
    const c=$("#mirror-ink").getContext("2d"),points=paths[part],segments=(points.length-1)*progress;
    const whole=Math.floor(segments),fraction=segments-whole;
    c.save();c.lineCap="round";c.lineJoin="round";
    c.beginPath();c.moveTo(points[0][0]*innerWidth,points[0][1]*innerHeight);
    for(let i=1;i<=whole;i++)c.lineTo(points[i][0]*innerWidth,points[i][1]*innerHeight);
    if(whole<points.length-1){
      const a=points[whole],b=points[whole+1];
      c.lineTo((a[0]+(b[0]-a[0])*fraction)*innerWidth,(a[1]+(b[1]-a[1])*fraction)*innerHeight);
    }
    c.strokeStyle="#d7d2c666";c.lineWidth=10;c.stroke();
    c.strokeStyle="#100c0a";c.lineWidth=5.5;c.stroke();c.restore();
    const a=points[whole],b=points[Math.min(whole+1,points.length-1)];
    return [(a[0]+(b[0]-a[0])*fraction)*innerWidth,(a[1]+(b[1]-a[1])*fraction)*innerHeight];
  }
  function renderMarks(){
    const c=$("#mirror-ink").getContext("2d");c.clearRect(0,0,innerWidth,innerHeight);
    const marks=Object.keys(s.measurements).filter(part=>s.measurements[part]>0);
    for(const part of marks)drawInk(part);
    $("#mirror-labels").innerHTML=marks.map(part=>`<span class="ink-label" style="left:${labelPoints[part][0]*100}%;top:${labelPoints[part][1]*100}%">${inkName(part)}</span>`).join("");
  }
  function measure(part){
    if(markerBusy)return;
    markerBusy=true;
    s.measurements[part]++;const count=s.measurements[part];
    s.scrutiny++;if(count>1){s.compulsions++;s.scrutiny++;}
    act("measure_"+part,{},1);
    const old={jaw:"Strong enough?",shoulder:"Could I make them wider?",frame:"Do I look like someone people move aside for?"};
    const newLines={jaw:"Too angular?",shoulder:"Could I make them narrower?",frame:"Would anyone notice before I spoke?"};
    const hand=$("#marker-hand"),start=performance.now();
    hand.classList.remove("hidden");$("#mirror-labels").innerHTML="";
    const animate=now=>{
      const progress=Math.min(1,(now-start)/850);
      const ctx=$("#mirror-ink").getContext("2d");ctx.clearRect(0,0,innerWidth,innerHeight);
      for(const other of Object.keys(s.measurements))if(other!==part&&s.measurements[other])drawInk(other);
      const [x,y]=drawInk(part,progress);hand.style.left=(x-12)+"px";hand.style.top=(y-16)+"px";
      if(progress<1)requestAnimationFrame(animate);
      else{markerBusy=false;hand.classList.add("hidden");renderMarks();
        thought(count>2?"I already know the line. I trace it again anyway.":(s.migrated?newLines:old)[part]);}
    };
    requestAnimationFrame(animate);
  }
  function bedclothes(){
    if(s.flags.bedMade){thought("There is somewhere to come back to.");return}
    physical({type:"make_bed",changes:{cared:2},line:"The floor is still a mess, but there is somewhere to come back to.",before:"bed-close.png",after:"bed-made.png",caption:"Pull the blanket across.",minutes:3,beforeFocus:"30% center",afterFocus:"30% center",done:()=>{s.flags.bedMade=true}});
  }
  function gym(){panel("GYM BAG","The plan","DAY 1: CHEST. DAY 2: BACK. DAY 3: Be impossible to dismiss. A measuring tape is knotted around the handle.",[
    ["Recheck your measurements",()=>physical({type:"gym_measure",changes:{scrutiny:2,masc:1},line:"A centimeter can feel like a verdict even when nothing has changed.",before:"bed-close.png",after:"mirror-close.png",caption:"The tape comes loose from the bag."})],
    ["Put the tape back",()=>finishAction("gym_leave",{cared:1},"The tape does not need to come with me.")],
    ["Write a stricter plan",()=>finishAction("gym_plan",{scrutiny:2,masc:2},"This plan has no rest days. Neither did the last one.")]
  ]);}
  function window(){
    physical({type:"open_window",changes:{cared:2},line:"Cool air interrupts the stale warmth. The flat feels slightly less sealed.",before:"desk-close.png",after:"desk-close.png",caption:"The latch gives. Night air moves the curtain.",minutes:2,done:()=>{s.flags.windowOpen=true}});
  }
  function chair(){
    if(s.flags.chairCleared){computer();return}
    physical({type:"clear_chair",changes:{cared:1},line:"The boxers and shirt are off the chair. I can sit down without negotiating with yesterday.",before:"chair-clothes.png",after:"desk-close.png",caption:"Lift the boxers. Move the shirt.",minutes:2,beforeFocus:"90% center",done:()=>{s.flags.chairCleared=true}});
  }
  function dishes(){
    if(s.flags.kitchenClean){thought("The counter stays clear.");return}
    physical({type:"wash_dishes",changes:{cared:2},line:"A square of counter reappears.",before:"kitchen.png",after:"kitchen-clean.png",caption:"Rinse. Scrub. Set the bowl down.",minutes:4,done:()=>{s.flags.kitchenClean=true}});
  }
  function food(){panel("KITCHEN","Something to eat","There is bread, cheese, and half a carton of takeout. You have been trying to leave on coffee alone.",[
    ["Make a sandwich",()=>physical({type:"eat",changes:{cared:2},line:"The first bite reminds me that I was hungry.",before:"kitchen.png",after:"kitchen-clean.png",caption:"Bread. Cheese. A place to sit.",minutes:3,done:()=>{s.flags.kitchenClean=true}})],
    ["Just drink water",()=>physical({type:"water",changes:{cared:1},line:"At least that.",before:"kitchen.png",after:"kitchen.png",caption:"I fill a glass.",minutes:1})]
  ]);}
  function trash(){
    if(s.flags.kitchenClean){thought("The bag is already by the door.");return}
    physical({type:"take_trash",changes:{cared:1},line:"The bag is ready to go out with me.",before:"kitchen.png",after:"kitchen-clean.png",caption:"Tie the bag. Clear the counter.",minutes:3,done:()=>{s.flags.kitchenClean=true}});
  }
  function exit(){
    panel("FRONT DOOR","Leave the flat?","Once you go downstairs, this playthrough ends. You may want to look around a little longer.",[
      ["Yes, open the door",()=>end(false)],
      ["Keep looking around",closePanel],
      ["Stay in tonight and end the evening",()=>end(true)]
    ]);
  }
  function computer(){
    closePanel();$("#computer").classList.remove("hidden");
    s.visits.computer=(s.visits.computer||0)+1;record("sit_computer",{visit:s.visits.computer});desktop();
    if(s.visits.computer===1)thought("The computer is still on. Of course it is.");
  }
  function desktop(){
    activeApp=null;$("#app-window").classList.add("hidden");
    const apps=[["forum","▤","MEN’S FORUM"],["calculator","▦","BODY SCORE"],["avatar","♙","AVATAR"],["downloads","▣","DOWNLOADS"],["history","◷","HISTORY"],["messages","✉","MESSAGES"]];
    $("#desktop").innerHTML=apps.map(([id,icon,label])=>`<button class="desktop-icon" data-app="${id}"><span>${icon}</span>${label}</button>`).join("");
    $("#desktop").querySelectorAll("[data-app]").forEach(b=>b.onclick=()=>openApp(b.dataset.app));
  }
  function windowHtml(name,body){
    const w=$("#app-window");w.innerHTML=`<div class="window-bar"><span>${esc(name)}</span><button id="window-close" aria-label="Close window">×</button></div><div class="window-body">${body}</div>`;
    w.classList.remove("hidden");$("#window-close").onclick=desktop;
    w.querySelectorAll("[data-cmd]").forEach(b=>b.onclick=()=>command(b.dataset.cmd));
  }
  function avatarVisual(state="default"){
    return `<div class="avatar-image ${state}" role="img" aria-label="Portrait of Taylor’s ${state} character avatar"></div>`;
  }
  function openApp(app){
    activeApp=app;s.computerVisits[app]=(s.computerVisits[app]||0)+1;
    record("open_app",{app,visit:s.computerVisits[app]});
    if(s.computerVisits[app]>1){s.compulsions++;if(["calculator","passing"].includes(app))s.scrutiny++;}
    switch(app){
      case "forum":windowHtml("FORUM / SELF-IMPROVEMENT",`<div class="fake-search">What makes a man attractive?</div><h3>Ten things people judge before you speak</h3><div class="post">Shoulders, jaw, height, confidence. You can work on three of the four. You can measure all of them.</div><button data-cmd="forum_calc">Open the body-score calculator</button><button data-cmd="forum_reply">Read replies: “I tried everything”</button><button data-cmd="forum_other">Suggested: what if masculinity was never the goal?</button>`);break;
      case "calculator":windowHtml("BODY SCORE.EXE",`<h3>${s.migrated?"PASSING SCORE":"MASCULINITY SCORE"}</h3><p>Enter the measurements. The program will tell you what you need to change.</p><label>Shoulder width, cm<input type="number" value="42" min="20" max="80" aria-label="Shoulder width in centimeters"></label><label>Height, cm<input type="number" value="173" min="100" max="230" aria-label="Height in centimeters"></label><button data-cmd="run_calc">CALCULATE</button><p id="calc-result"></p><button data-cmd="open_passing">Open a related passing guide</button>`);break;
      case "avatar":windowHtml("CHARACTER CREATOR",`<h3>Character creator</h3>${avatarVisual("default")}<p>An old save file. You spent longer changing this character than playing the game.</p><button data-cmd="avatar_soft">Try longer hair and a softer face</button><button data-cmd="avatar_reset">Return to the default avatar</button><p id="avatar-result">Preview: default character</p>`);break;
      case "downloads":windowHtml("DOWNLOADS",`<h3>Files</h3><div class="post">gym-plan.pdf<br>profile-edit-4.jpg<br>SECOND_PROFILE.png</div><button data-cmd="second_profile">Open SECOND_PROFILE.png</button><button data-cmd="delete_profile">Move SECOND_PROFILE.png to trash</button>`);break;
      case "history":windowHtml("BROWSER HISTORY",`<h3>Recently opened</h3><button data-cmd="forum_history">shoulder to waist ratio</button><button data-cmd="profile_history">character creator: old save</button><button data-cmd="open_passing">can men look better as women?</button><p>Closing a page never erased why you opened it.</p>`);break;
      case "messages":windowHtml("MESSAGES / ALEX",`<h3>Still good for eight?</h3><p>“We can just walk. No need to explain anything tonight.”</p><button data-cmd="message_ready">Send: “I’m getting ready”</button><button data-cmd="message_honest">Send: “I’m trying something on. I’m nervous.”</button><button data-cmd="message_close">Close without answering</button>`);break;
      case "passing":windowHtml("FORUM / PASSING",`<div class="fake-search">transmaxxing / passing guides</div><h3>A different future, the same arithmetic</h3><div class="post">One post describes unexpected relief in a different presentation. The reply beneath it has a chart of jaw angles, shoulder ranges, and “failure points.”</div><button data-cmd="read_relief">Read about relief</button><button data-cmd="passing_calc">Run a passing calculator</button><button data-cmd="close_scores">Close every score</button>`);break;
      case "second":windowHtml("SECOND_PROFILE.PNG",`<h3>The second profile</h3>${avatarVisual("soft")}<p>Soft hair. Another name. You made this character as a joke and logged in 37 times.</p><button data-cmd="profile_stay">Keep the image open</button><button data-cmd="profile_name">Rename the file MAYBE.png</button><button data-cmd="passing_calc">Check whether this would pass</button>`);break;
    }
  }
  function migrate(){
    if(s.migrated)return;
    s.migrated=true;record("ruler_migrated");toast("THE MIRROR HAS NEW LABELS");
    thought("The measurements have changed names. My hands know exactly what to do.");
  }
  function command(cmd){
    record("computer_click",{command:cmd});
    switch(cmd){
      case "forum_calc":openApp("calculator");return;
      case "forum_reply":act(cmd,{scrutiny:1});thought("He sounds like me until the part where he says there is only one way out.");return;
      case "forum_other":case "open_passing":act(cmd,{explored:1});openApp("passing");return;
      case "run_calc": {
        act(cmd,{scrutiny:2},2);
        const n=s.computerVisits.calculator||1;
        $("#calc-result").textContent=(s.migrated?"PASSING":"MASCULINITY")+" SCORE: 42%. "+(n>1?"Same result. You can enter the numbers again.":"Most factors are marked “improvable.”");
        thought(s.migrated?"Forty-two. A different ideal can still make the same number hurt.":"Forty-two. It feels cruel enough to be objective.");
        return;
      }
      case "avatar_soft":s.genderSeen=true;act(cmd,{explored:2});$(".avatar-image").className="avatar-image soft";$("#avatar-result").textContent="Preview: softer hair, familiar eyes.";thought("I thought I was choosing a character. I kept choosing a way to be seen.");return;
      case "avatar_reset":act(cmd,{avoidance:1});$(".avatar-image").className="avatar-image default";$("#avatar-result").textContent="Preview: default character";thought("The old face returns. I remember the other one.");return;
      case "second_profile":openApp("second");return;
      case "delete_profile":act(cmd,{avoidance:2});thought("The file disappears. I still know what it looked like.");return;
      case "forum_history":openApp("forum");return;
      case "profile_history":openApp("avatar");return;
      case "message_ready":s.answered=true;s.phoneRead=true;if(s.stage===0)s.stage=1;act(cmd,{connection:2});thought("Sent. Alex is still there.");objective();return;
      case "message_honest":s.answered=true;s.phoneRead=true;if(s.stage===0)s.stage=1;act(cmd,{connection:3,explored:1});thought("Alex: ‘Okay. I’d like to meet you however you come down.’");objective();return;
      case "message_close":act(cmd,{avoidance:1});desktop();thought("The message waits beneath the other windows.");return;
      case "read_relief":s.genderSeen=true;act(cmd,{explored:2});thought("Somebody says they simply liked how they felt. The replies demand measurements.");return;
      case "passing_calc":migrate();act(cmd,{scrutiny:3});openApp("calculator");thought("The old calculator has a new title. I know where to type.");return;
      case "close_scores":act(cmd,{cared:1});desktop();thought("There is no verdict on the screen. I can leave it that way.");return;
      case "profile_stay":s.genderSeen=true;act(cmd,{explored:2});$(".avatar-image").className="avatar-image free";thought("For a moment there is nothing to fix.");return;
      case "profile_name":s.genderSeen=true;act(cmd,{explored:1});thought("MAYBE feels less like evidence than permission.");return;
    }
  }
  function end(stay){
    PassingWorld.stop();
    closePanel();$("#computer").classList.add("hidden");
    let key;
    if(stay)key="room";
    else if(s.migrated && s.scrutiny>=8 && s.compulsions>=2)key="perfect";
    else if(s.genderSeen && s.connection>=3 && s.explored>=3)key="outside";
    else if(s.genderSeen && s.avoidance>=3 && s.connection<3)key="profile";
    else if(s.masc>=3 && s.scrutiny>=4)key="higher";
    else key="walk";
    const endings={
      room:["THE ROOM","You let the handle go. Alex eventually heads home. The window is still open, or the computer still glowing, or both. Nothing is settled tonight.","Morning will arrive without a verdict.","room.png"],
      perfect:["PERFECT ENOUGH","The plum top brought relief. Then the photographs, the guides, and the numbers gave that relief another entrance exam. You look at the mirror once more before leaving.","The ruler changed sides. It did not leave.","mirror-visible.png"],
      outside:["OUTSIDE","You go downstairs before you have a finished explanation. Alex looks at you, takes in what you chose to wear, and asks if you want to walk toward the tram.","An unfinished self can still have an evening.","doorway.png"],
      profile:["THE SECOND PROFILE","You open the door with the parcel hidden and the name still saved privately. Alex is there. The possibility is there too, just out of sight.","Keeping it safe and keeping it alone have begun to feel similar.","doorway.png"],
      higher:["HIGHER SCORE","You adjust your shoulders before opening the door. Alex smiles. You try to decide whether the smile means you passed.","You can leave the flat and carry the examination with you.","doorway.png"],
      walk:["THE WALK","You open the door as you are. Alex is leaning against the wall, checking a map of the tram route. You begin walking.","Nothing needed to be solved before the evening could begin.","doorway.png"]
    };
    s.ending=key;record("ending",{ending:key,stay});
    const [title,copy,line,image]=endings[key];
    $("#ending-title").textContent=title;$("#ending-copy").textContent=copy;$("#ending-line").textContent=line;$("#ending-image").src=retroAsset(image);show("ending");
  }
  function debrief(){
    const data=[["Mirror checks",Object.values(s.measurements).reduce((a,b)=>a+b,0)],["Computer windows",Object.values(s.computerVisits).reduce((a,b)=>a+b,0)],["Times at the door",s.visits.door||0],["Acts of care",s.cared],["Messages answered",s.answered?"Yes":"No"],["Time in the flat",Math.floor(s.minutes)+" min"]];
    $("#stats").innerHTML=data.map(([label,value])=>`<div class="stat"><b>${esc(value)}</b><span>${esc(label.toUpperCase())}</span></div>`).join("");
    $("#reading").textContent=s.migrated?"You encountered the migration: jaw, shoulders, and frame remained in place while their meanings changed. "+(s.compulsions>=2?"You returned to a measurement more than once.":"You did not need to follow every invitation to check again."):"You did not need to find the passing material for the story to end. The earlier measurements already shaped the room.";
    show("debrief");
  }
  $("#start").onclick=()=>{s=fresh();timeDecision=false;show("play");updateTime();objective();PassingWorld.refresh(s.flags);PassingWorld.start({interact,area:enterRoom})};
  $("#back").onclick=()=>{};$("#panel-close").onclick=closePanel;
  $("#mirror-exit").onclick=()=>$("#mirror-mode").classList.add("hidden");
  $("#mirror-stay").onclick=()=>{
    $("#mirror-mode").classList.add("hidden");
    act("mirror_remain",{cared:1,explored:s.genderSeen?1:0},2);
    thought("I let the reflection exist without giving it a grade.");
  };
  $("#mirror-send").onclick=()=>{
    if(markerBusy)return;
    $("#mirror-mode").classList.add("hidden");
    s.photoSent=true;s.answered=true;
    act("send_photo",{connection:3,explored:1},3);
    toast("ALEX: There you are.");
    thought("The picture was unfinished. I sent it anyway.");
  };
  document.querySelectorAll("[data-mark]").forEach(b=>b.onclick=()=>measure(b.dataset.mark));
  globalThis.addEventListener("resize",()=>{if(!$("#mirror-mode").classList.contains("hidden"))resizeMirror()});
  $(".panel-shade").onclick=closePanel;
  $("#help").onclick=()=>panel("CONTROLS","Explore the apartment","On a phone, hold the arrow buttons to walk and drag the room to turn. On a computer, use WASD to walk and drag to look. Approach furniture until USE appears, then tap the object or USE. Walk through open doorways to reach the other rooms. The clock advances slowly when you act. Walking, looking around and moving between rooms take no time. Alex is downstairs at 20:00; you will get a clear choice when the time arrives.",[["Got it",closePanel]]);
  $("#computer-exit").onclick=()=>{$("#computer").classList.add("hidden");thought("The flat is still here around the screen.")};
  $("#debrief-open").onclick=debrief;
  $("#restart").onclick=()=>{PassingWorld.stop();s=fresh();show("intro")};
  $("#download").onclick=()=>{
    const blob=new Blob([JSON.stringify(s,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="passing-session.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  $("#computer-screen").addEventListener("pointermove",e=>{const r=e.currentTarget.getBoundingClientRect();$("#cursor").style.left=(e.clientX-r.left)+"px";$("#cursor").style.top=(e.clientY-r.top)+"px"});
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){if(!$("#computer").classList.contains("hidden"))$("#computer-exit").click();else if(!$("#mirror-mode").classList.contains("hidden"))$("#mirror-exit").click();else if(!$("#panel").classList.contains("hidden"))closePanel();}
  });
})();
