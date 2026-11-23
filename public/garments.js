// Shared pixel geometry keeps shop previews and equipped clothes consistent.
export function drawGarment(ctx,x,y,item) {
  const design=item?.design||'plain',color=item?.color||'#77aaff';
  const rect=(dx,dy,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+dx,y+dy,w,h);};
  if(design==='crown'){
    rect(-14,-54,28,9,'#d5a644');rect(-14,-62,6,10,'#ffdb70');
    rect(-3,-66,6,14,'#ffdb70');rect(8,-62,6,10,'#ffdb70');
    rect(-11,-48,22,3,'#fff0ad');rect(-2,-54,4,4,'#bc77ad');return;
  }
  if(design==='hoodie'){
    rect(-15,-65,30,32,'#318e82');rect(-11,-61,22,23,'#244b54');
    rect(-15,-63,4,26,color);rect(11,-63,4,26,color);
  }
  rect(-13,-38,26,26,color);
  const sleeve=design==='varsity'?'#f5dfbf':color;
  rect(-18,-36,7,design==='tee'?9:21,sleeve);
  rect(11,-36,7,design==='tee'?9:21,sleeve);
  rect(-11,-14,22,3,'#343c5b');
  if(design==='hoodie'){
    rect(-7,-38,3,12,'#eff7d6');rect(4,-38,3,12,'#eff7d6');
    rect(-8,-23,16,7,'#328f83');rect(-6,-24,12,2,'#95ffe1');
    rect(-18,-18,7,3,'#328f83');rect(11,-18,7,3,'#328f83');
  } else if(design==='denim'){
    rect(-10,-39,7,6,'#a6c6dc');rect(3,-39,7,6,'#a6c6dc');
    rect(-1,-34,2,22,'#dfc997');rect(-9,-29,6,7,'#43658d');rect(4,-29,6,7,'#43658d');
    rect(-9,-29,6,2,'#c0d4da');rect(4,-29,6,2,'#c0d4da');
    rect(-17,-18,5,3,'#c0d4da');rect(12,-18,5,3,'#c0d4da');
  } else if(design==='fur'){
    rect(-15,-41,11,8,'#f4e5c9');rect(4,-41,11,8,'#f4e5c9');
    rect(-12,-36,6,8,'#dfc99f');rect(6,-36,6,8,'#dfc99f');
    rect(-2,-35,4,23,'#f4e5c9');rect(-18,-19,7,6,'#f4e5c9');rect(11,-19,7,6,'#f4e5c9');
    rect(-13,-14,26,4,'#dfc99f');rect(-15,-42,3,3,'#fff5de');rect(10,-43,4,3,'#fff5de');
    rect(-11,-25,5,2,'#674c45');rect(6,-25,5,2,'#674c45');
  } else if(design==='varsity'){
    rect(-10,-39,20,3,'#663e62');rect(-1,-35,2,22,'#fff0d0');
    rect(5,-32,5,2,'#fff0d0');rect(5,-30,2,6,'#fff0d0');
    rect(-17,-17,5,3,'#663e62');rect(12,-17,5,3,'#663e62');
  } else if(design==='star'){
    rect(-8,-39,16,4,'#8265b4');rect(-2,-32,4,12,'#ffedaa');rect(-6,-28,12,4,'#ffedaa');
    rect(-4,-24,3,4,'#ffedaa');rect(2,-24,3,4,'#ffedaa');
    for(let dx=-10;dx<12;dx+=4)rect(dx,-16,2,4,'#8265b4');
    rect(-18,-18,7,3,'#8265b4');rect(11,-18,7,3,'#8265b4');
  } else if(design==='stripes'){
    for(const dy of [-33,-25,-17]){rect(-13,dy,26,4,'#416c7d');rect(-18,dy,7,4,'#416c7d');rect(11,dy,7,4,'#416c7d');}
    rect(-8,-39,16,4,'#416c7d');
  } else if(design==='tee'){
    rect(-7,-38,14,3,'#994f83');rect(-5,-29,10,9,'#f9e6c5');
    rect(-2,-27,2,2,'#994f83');rect(2,-27,2,2,'#994f83');rect(-2,-23,6,2,'#994f83');
  }
}
