export const SIZE=10;
export const furniture=[{x:1,y:1,type:'arcade'},{x:2,y:1,type:'arcade'},{x:7,y:1,type:'plant'},{x:8,y:2,type:'sofa'},{x:8,y:3,type:'sofa'},{x:1,y:7,type:'plant'},{x:7,y:7,type:'table'},{x:7,y:8,type:'seat'}];
export const blocked=(x,y)=>x<0||y<0||x>=SIZE||y>=SIZE||furniture.some(f=>f.x===x&&f.y===y)||(x===4&&y===2);
export const catalog=[{id:'neon',name:'Casaco Neon',price:120,color:'#62f5cd',kind:'coat'},{id:'violet',name:'Violeta FM',price:180,color:'#bb98ff',kind:'coat'},{id:'sunset',name:'Sunset Club',price:160,color:'#ff9978',kind:'coat'},{id:'crown',name:'Coroa Pixel',price:300,color:'#ffdb70',kind:'hat'}];
