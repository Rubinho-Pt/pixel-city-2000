import {readFile,writeFile,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const dir=process.env.DATA_DIR||fileURLToPath(new URL('./data/',import.meta.url));
const db=JSON.parse(await readFile(dir+'/state.json','utf8'));
const user=db.users.find(u=>u.name===process.argv[2]);
if(!user)throw new Error('Conta inexistente. Uso: node admin.mjs "Nome" (com servidor parado)');
user.role='admin';await writeFile(dir+'/state.tmp',JSON.stringify(db));await rename(dir+'/state.tmp',dir+'/state.json');console.log('Administrador atribuído a '+user.name);
