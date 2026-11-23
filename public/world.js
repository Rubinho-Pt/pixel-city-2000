export const SIZE=10;
export const furniture=[{x:1,y:1,type:'arcade'},{x:2,y:1,type:'arcade'},{x:7,y:1,type:'plant'},{x:8,y:2,type:'sofa'},{x:8,y:3,type:'sofa'},{x:1,y:7,type:'plant'},{x:7,y:7,type:'table'},{x:7,y:8,type:'seat'}];
export const rooms = {
  plaza: {
    id: 'plaza', name: 'Praça Frequência', label: 'FREQUÊNCIA', sign: 'FREQ. 2000',
    description: 'Arcades, conversa e o teu primeiro encontro com a Lia.',
    subtitle: 'o teu lugar na cidade', spawn: {x:5,y:6}, furniture,
    npc: {x:4,y:2,name:'Lia',coat:'#f6a0ab',hair:'#a46b54'},
    theme: {wall:'#6e6786',wallLeft:'#88809e',tile:'#9991ad',tileAlt:'#a69db9',rug:'#7b739a',rugAlt:'#857ba5'},
  },
  garden: {
    id: 'garden', name: 'Jardim Suspenso', label: 'JARDIM SUSPENSO', sign: 'JARDIM FM',
    description: 'Uma pausa entre plantas, bancos e conversas tranquilas.',
    subtitle: 'respira. fica um pouco.', spawn: {x:5,y:7},
    furniture: [{x:1,y:1,type:'plant'},{x:2,y:1,type:'plant'},{x:7,y:1,type:'plant'},{x:8,y:2,type:'plant'},{x:1,y:6,type:'plant'},{x:1,y:7,type:'plant'},{x:7,y:5,type:'table'},{x:7,y:6,type:'seat'},{x:6,y:5,type:'seat'},{x:3,y:3,type:'sofa'},{x:3,y:4,type:'sofa'}],
    npc: {x:6,y:2,name:'Noa',coat:'#a4d4a1',hair:'#47352d'},
    theme: {wall:'#47746f',wallLeft:'#628b7c',tile:'#85a591',tileAlt:'#a1bba0',rug:'#bfc295',rugAlt:'#aeb58c'},
  },
};
export const getRoom = id => Object.hasOwn(rooms, id) ? rooms[id] : null;
export const blocked = (x,y,roomId='plaza') => {
  const room=getRoom(roomId);
  return !room || x<0 || y<0 || x>=SIZE || y>=SIZE || room.furniture.some(f=>f.x===x&&f.y===y) || (x===room.npc.x&&y===room.npc.y);
};
export const appearanceOptions = {
  skin: ['#eeb48f','#f6d8bd','#d99b75','#ae7452','#784d38','#493227'],
  hair: ['#35314a','#704834','#b27644','#e5c67b','#c8c9db','#a278c5'],
  style: ['short','bob','crest'],
};
export const defaultAppearance={skin:appearanceOptions.skin[0],hair:appearanceOptions.hair[0],style:'short'};
export const catalog = [
  {id:'neon',name:'Hoodie Neon',price:120,color:'#62f5cd',kind:'coat',category:'Casacos',design:'hoodie',detail:'Capuz, cordões e bolso canguru'},
  {id:'denim',name:'Ganga 2000',price:220,color:'#658ab9',kind:'coat',category:'Casacos',design:'denim',detail:'Gola, costuras e bolsos de peito'},
  {id:'shearling',name:'Casaco Polar',price:260,color:'#a77960',kind:'coat',category:'Casacos',design:'fur',detail:'Gola e punhos de pelo sintético'},
  {id:'sunset',name:'Sunset College',price:160,color:'#ff9978',kind:'coat',category:'Casacos',design:'varsity',detail:'Mangas creme e emblema do clube'},
  {id:'violet',name:'Estrela FM',price:180,color:'#bb98ff',kind:'coat',category:'Camisolas',design:'star',detail:'Malha canelada com estrela bordada'},
  {id:'stripes',name:'Maré Retro',price:100,color:'#e8ddbd',kind:'coat',category:'Camisolas',design:'stripes',detail:'Camisola de manga comprida às riscas'},
  {id:'tee',name:'T-shirt Pixel',price:80,color:'#e89ab6',kind:'coat',category:'Camisolas',design:'tee',detail:'Manga curta e desenho pixel no peito'},
  {id:'crown',name:'Coroa Pixel',price:300,color:'#ffdb70',kind:'hat',category:'Acessórios',design:'crown',detail:'Uma pequena coroa, muito estilo'},
];
