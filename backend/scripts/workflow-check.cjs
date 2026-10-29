const {createRequire}=require('node:module');
const fs=require('node:fs'); const path=require('node:path'); const crypto=require('node:crypto'); const assert=require('node:assert/strict');
const root=path.resolve(__dirname, '../..');
const reportPath=process.env.WORKFLOW_REPORT_PATH || path.join(root,'backend/test-results/workflow.json');
const req=createRequire(root+'/backend/package.json');
const {database,port}=req('./src/config/env'); const {Client}=req('pg'); const bcrypt=req('bcrypt');
const run=crypto.randomBytes(4).toString('hex'); const prefix='Workflow QA '+run;
const base='http://localhost:'+port; const results=[]; const ids=[]; const files=[]; const projects=[];
const db=new Client({...database,connectionTimeoutMillis:5000}); const actors={};
async function request(actor, method, route, body, expected=200){
 const headers={'X-Forwarded-For':`198.18.${parseInt(run.slice(0,2),16)}.${actor ? ['admin','member','outsider','otherAdmin'].indexOf(actor)+1 : 100}`}; if(actor) headers.Authorization='Bearer '+actors[actor].token;
 if(body && !(body instanceof FormData)) headers['Content-Type']='application/json';
 const response=await fetch(base+'/api'+route,{method,headers,body:body instanceof FormData?body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000)});
 const text=await response.text(); let data;try{data=JSON.parse(text)}catch{data=text}
 assert.equal(response.status,expected,method+' '+route+' expected '+expected+', got '+response.status+' '+(response.status>=400?JSON.stringify(data):''));return data;
}
async function check(name,fn){try{await fn();results.push({name,status:'PASS'});console.log('PASS '+name)}catch(e){results.push({name,status:'FAIL',detail:e.message});console.log('FAIL '+name+': '+e.message)}}
async function main(){
 if(process.env.NODE_ENV==='production'||!['localhost','127.0.0.1','::1'].includes(database.host)||database.connectionString)throw Error('Local database required');
 if(process.env.SMTP_USER&&process.env.SMTP_PASS)throw Error('Live SMTP is configured; use an isolated mail capture before running assignment tests');
 await db.connect();
 try{
  for(const [key,role] of [['admin','admin'],['member','member'],['outsider','member'],['otherAdmin','admin']]){
   const email=`qa.${run}.${key.toLowerCase()}@example.invalid`,password='Qa-'+crypto.randomBytes(12).toString('base64url');
   const row=(await db.query('INSERT INTO users(username,email,password,role) VALUES($1,$2,$3,$4) RETURNING id',[`QA_${run}_${key}`,email,await bcrypt.hash(password,10),role])).rows[0];
   ids.push(row.id);actors[key]={id:row.id,email,password,role};
   const login=await request(null,'POST','/auth/login',{email,password});actors[key].token=login.token;
  }
  console.log('Created isolated QA accounts');
  await check('Admin and member authentication',async()=>{for(const role of ['admin','member']){const p=await request(role,'GET','/auth/me');assert.equal(p.id,actors[role].id)}});
  await check('Invalid password is rejected',()=>request(null,'POST','/auth/login',{email:actors.member.email,password:'incorrect-test-password'},400));
  await check('Unauthenticated task requests are rejected',()=>request(null,'GET','/tasks',null,401));
  await check('Member cannot access administrator user list',()=>request('member','GET','/auth/users',null,403));
  await check('Public registration ignores requested admin role',async()=>{
   const email=`qa.${run}.signup@example.invalid`;const created=await request(null,'POST','/auth/register',{email,password:'Qa-signup-password!',role:'admin'});ids.push(created.id);assert.equal(created.role,'member');
  });
  await check('Admin creates, updates, and removes a member',async()=>{
   const email=`qa.${run}.managed@example.invalid`;const created=await request('admin','POST','/auth/admin/members',{email,password:'Qa-managed-password!',username:'QA managed'},201);ids.push(created.id);
   const updated=await request('admin','PUT',`/auth/admin/members/${created.id}`,{email,username:'QA managed updated'});assert.equal(updated.username,'QA managed updated');await request('admin','DELETE',`/auth/admin/members/${created.id}`);
  });
  await check('Invitation acceptance creates a usable member login',async()=>{
   const email=`qa.${run}.invite@example.invalid`;const invited=await request('admin','POST','/auth/invite',{email});
   const row=(await db.query('SELECT id FROM users WHERE email=$1',[email])).rows[0];ids.push(row.id);
   const token=new URL(invited.invite_url).searchParams.get('token');const password='Qa-invite-password!';
   const accepted=await request(null,'POST','/auth/accept-invite',{token,password,username:'QA invited'});assert(accepted.token);assert((await request(null,'POST','/auth/login',{email,password})).token);
   await request(null,'POST','/auth/accept-invite',{token,password},400);
  });
  await check('Password change rejects the old password and accepts the new one',async()=>{
   const actor=actors.outsider;const newPassword='Qa-changed-'+run+'!';await request('outsider','PUT','/auth/me/password',{currentPassword:actor.password,newPassword});await request(null,'POST','/auth/login',{email:actor.email,password:actor.password},400);assert((await request(null,'POST','/auth/login',{email:actor.email,password:newPassword})).token);actor.password=newPassword;
  });
  await check('Password reset token works once and permits login',async()=>{
   const actor=actors.outsider;await request(null,'POST','/auth/forgot-password',{email:actor.email});
   const token=(await db.query('SELECT reset_token FROM users WHERE id=$1',[actor.id])).rows[0].reset_token;assert(token);
   const newPassword='Qa-reset-'+run+'!';await request(null,'POST','/auth/reset-password',{token,newPassword});assert((await request(null,'POST','/auth/login',{email:actor.email,password:newPassword})).token);await request(null,'POST','/auth/reset-password',{token,newPassword},400);actor.password=newPassword;
  });
  await check('Missing accounts receive a generic reset response',async()=>{const result=await request(null,'POST','/auth/forgot-password',{email:`missing.${run}@example.invalid`});assert.match(result.message,/If that email exists/)});
  await check('Profile avatar upload and download',async()=>{
   const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aUTsAAAAASUVORK5CYII=','base64');const form=new FormData();form.append('avatar',new Blob([image],{type:'image/png'}),'qa-avatar.png');const saved=await request('member','POST','/auth/me/avatar',form);files.push(saved.avatar_url.split('/').pop());const response=await fetch(base+saved.avatar_url);assert.equal(response.status,200);assert(Buffer.from(await response.arrayBuffer()).equals(image));
  });
  let project;
  await check('Admin creates project',async()=>{project=await request('admin','POST','/projects',{name:prefix,description:'Disposable end-to-end workflow fixture'},201);projects.push(project.id)});
  if(!project)throw Error('Project setup failed');
  await check('Member cannot create project',()=>request('member','POST','/projects',{name:'Forbidden'},403));
  await check('Project membership assignment and member visibility',async()=>{await request('admin','POST',`/projects/${project.id}/members`,{user_id:actors.member.id},201);assert((await request('member','GET','/projects')).some(p=>p.id===project.id));assert(!(await request('outsider','GET','/projects')).some(p=>p.id===project.id))});
  await check('Project name and description can be edited',async()=>{const p=await request('admin','PUT',`/projects/${project.id}`,{name:prefix+' updated',description:'Updated workflow project'});assert.equal(p.description,'Updated workflow project')});
  await check('Another admin cannot edit this project',()=>request('otherAdmin','PUT',`/projects/${project.id}`,{name:'Forbidden'},403));
  await check('Empty project name rejected',()=>request('admin','POST','/projects',{name:' '},400));
  let task;
  await check('Create assigned task with attachment, priority, due date and labels',async()=>{
   const form=new FormData();for(const [k,v]of Object.entries({title:prefix+' task',description:'End-to-end attachment and workflow test',project_id:project.id,user_id:actors.member.id,priority:'high',is_big:'true',due_date:new Date(Date.now()+72*3600000).toISOString(),labels:JSON.stringify(['qa','workflow'])}))form.append(k,String(v));
   form.append('attachments',new Blob(['Disposable QA attachment '+run],{type:'text/plain'}),'workflow-qa.txt');
   task=await request('admin','POST','/tasks',form);assert.equal(task.status,'todo');assert.equal(task.priority,'high');assert.deepEqual(task.labels,['qa','workflow']);assert.equal(task.attachments.length,1);files.push(task.attachments[0].file_name);
  });
  if(!task)throw Error('Task setup failed');
  await check('Assigned member sees task; unrelated member cannot list it',async()=>{assert((await request('member','GET','/tasks')).some(t=>t.id===task.id));assert(!(await request('outsider','GET','/tasks')).some(t=>t.id===task.id))});
  await check('Attachment download matches uploaded content',async()=>{const r=await fetch(base+task.attachments[0].url);assert.equal(r.status,200);assert.equal(await r.text(),'Disposable QA attachment '+run)});
  await check('Task assignment notification reaches member',async()=>{const list=await request('member','GET','/notifications');const note=list.find(n=>n.task_id===task.id);assert(note);await request('member','PUT',`/notifications/${note.id}/read`);assert((await request('member','GET','/notifications')).find(n=>n.id===note.id).is_read)});
  await check('Member cannot read another user notification',async()=>{const note=(await request('member','GET','/notifications')).find(n=>n.task_id===task.id);await request('outsider','PUT',`/notifications/${note.id}/read`,null,404)});
  await check('Member cannot create, edit title, or delete tasks',async()=>{await request('member','POST','/tasks',{title:'Forbidden',project_id:project.id,user_id:actors.member.id},403);await request('member','PUT',`/tasks/${task.id}`,{title:'Forbidden'},403);await request('member','DELETE',`/tasks/${task.id}`,null,403)});
  await check('Task cannot be assigned to someone outside the project',()=>request('admin','POST','/tasks',{title:'Forbidden assignee',project_id:project.id,user_id:actors.outsider.id},400));
  let comment;
  await check('Member adds and reads a task comment',async()=>{comment=await request('member','POST',`/tasks/${task.id}/comments`,{content:'Workflow comment'},201);assert((await request('member','GET',`/tasks/${task.id}/comments`)).some(c=>c.id===comment.id))});
  await check('Empty comments rejected',()=>request('member','POST',`/tasks/${task.id}/comments`,{content:' '},400));
  await check('Unrelated member cannot read task comments',()=>request('outsider','GET',`/tasks/${task.id}/comments`,null,403));
  await check('Unrelated member cannot add task comments',()=>request('outsider','POST',`/tasks/${task.id}/comments`,{content:'Forbidden outsider comment'},403));
  await check('Another admin cannot read task comments',()=>request('otherAdmin','GET',`/tasks/${task.id}/comments`,null,403));
  await check('Comment mention creates a notification',async()=>{await request('admin','POST',`/tasks/${task.id}/comments`,{content:`@QA_${run}_member please review`},201);assert((await request('member','GET','/notifications')).some(n=>n.task_id===task.id&&n.message.includes('mentioned')))});
  await check('Only the comment author or owning admin can delete a comment',async()=>{await request('outsider','DELETE',`/comments/${comment.id}`,null,403);await request('member','DELETE',`/comments/${comment.id}`)});
  let sub1,sub2;
  await check('Create and edit task checklist',async()=>{sub1=await request('admin','POST',`/tasks/${task.id}/subtasks`,{title:'First QA step'});sub2=await request('member','POST',`/tasks/${task.id}/subtasks`,{title:'Second QA step'});const edited=await request('member','PUT',`/subtasks/${sub2.id}`,{title:'Second QA step edited'});assert.equal(edited.title,'Second QA step edited')});
  await check('Unrelated member cannot read checklist',()=>request('outsider','GET',`/tasks/${task.id}/subtasks`,null,403));
  await check('Another admin cannot read checklist',()=>request('otherAdmin','GET',`/tasks/${task.id}/subtasks`,null,403));
  await check('Assigned member moves task into progress',async()=>{const t=await request('member','PUT',`/tasks/${task.id}`,{status:'in-progress'});assert.equal(t.status,'in-progress')});
  await check('Status changes preserve existing labels',async()=>{assert.deepEqual((await request('member','GET','/tasks')).find(t=>t.id===task.id).labels,['qa','workflow'])});
  await check('Member cannot edit task labels',()=>request('member','PUT',`/tasks/${task.id}`,{labels:['forbidden']},403));
  await check('Invalid task status is rejected',async()=>{await request('member','PUT',`/tasks/${task.id}`,{status:'invalid-status'},400)});
  await request('member','PUT',`/tasks/${task.id}`,{status:'in-progress'});
  await check('Completing all checklist items completes the task',async()=>{await request('member','PUT',`/subtasks/${sub1.id}`,{is_done:true});await request('member','PUT',`/subtasks/${sub2.id}`,{is_done:true});const t=(await request('member','GET','/tasks')).find(t=>t.id===task.id);assert.equal(t.status,'done');assert(t.completed_at)});
  await check('Checklist completion notifies the owning administrator',async()=>{assert((await request('admin','GET','/notifications')).some(n=>n.task_id===task.id&&n.message.includes('completed')))});
  await check('Checklist completion is recorded in task activity',async()=>{assert((await request('admin','GET',`/tasks/${task.id}/activity`)).some(a=>a.action==='task_updated'&&a.detail.includes('checklist completed')))});
  let ordinary;
  await check('Normal task completion notifies project admin',async()=>{ordinary=await request('admin','POST','/tasks',{title:prefix+' completion',project_id:project.id,user_id:actors.member.id});await request('member','PUT',`/tasks/${ordinary.id}`,{status:'done'});assert((await request('admin','GET','/notifications')).some(n=>n.task_id===ordinary.id&&n.message.includes('completed')))});
  await check('Completed tasks cannot move backwards',()=>request('member','PUT',`/tasks/${ordinary.id}`,{status:'todo'},400));
  await check('Task activity records creation and completion',async()=>{const list=await request('admin','GET',`/tasks/${ordinary.id}/activity`);assert(list.some(a=>a.action==='task_created'));assert(list.some(a=>a.action==='task_updated'))});
  await check('Unrelated member cannot read task activity',()=>request('outsider','GET',`/tasks/${task.id}/activity`,null,403));
  await check('Project progress reflects completed tasks',async()=>{const p=(await request('admin','GET','/projects')).find(p=>p.id===project.id);assert.equal(Number(p.task_count),2);assert.equal(Number(p.done_count),2)});
  let duplicate;
  await check('Admin duplicates task',async()=>{duplicate=await request('admin','POST',`/tasks/${task.id}/duplicate`,null,201);assert.equal(duplicate.status,'todo');assert.equal(duplicate.user_id,actors.member.id)});
  await check('Duplicate preserves labels and checklist',async()=>{assert.deepEqual(duplicate.labels,['qa','workflow']);const list=await request('admin','GET',`/tasks/${duplicate.id}/subtasks`);assert.equal(list.length,2);assert(list.every(s=>s.is_done===false))});
  let template;
  await check('Create, list, and delete task template',async()=>{template=await request('admin','POST','/tasks/templates',{name:prefix,title:'Template task',priority:'high'},201);assert((await request('admin','GET','/tasks/templates')).some(t=>t.id===template.id));assert(!(await request('otherAdmin','GET','/tasks/templates')).some(t=>t.id===template.id));await request('admin','DELETE',`/tasks/templates/${template.id}`)});
  await check('Profile and preference updates persist',async()=>{await request('member','PUT','/auth/me/profile',{email:actors.member.email,username:'QA_'+run+'_member',timezone:'Europe/Budapest',language:'en'});await request('member','PUT','/auth/me/preferences',{dark_mode:true,notifications_enabled:false});const p=await request('member','GET','/auth/me');assert.equal(p.dark_mode,true);assert.equal(p.notifications_enabled,false)});
  await check('Mark all test account notifications read',async()=>{await request('member','PUT','/notifications/read-all');assert((await request('member','GET','/notifications')).every(n=>n.is_read))});
  await check('Unrelated member cannot change task status',()=>request('outsider','PUT',`/tasks/${task.id}`,{status:'done'},403));
  await check('Admin deletes task and project',async()=>{await request('admin','DELETE',`/tasks/${duplicate.id}`);await request('admin','DELETE',`/projects/${project.id}`);assert(!(await request('admin','GET','/projects')).some(p=>p.id===project.id))});
 }finally{
  for(const id of ids){
   const taskFiles=await db.query('SELECT a.file_name FROM task_attachments a JOIN tasks t ON t.id=a.task_id WHERE t.created_by=$1',[id]);for(const r of taskFiles.rows)files.push(r.file_name);
  }
  await db.query('DELETE FROM tasks WHERE created_by=ANY($1::int[])',[ids]);
  await db.query('DELETE FROM projects WHERE created_by=ANY($1::int[])',[ids]);
  await db.query('DELETE FROM users WHERE id=ANY($1::int[])',[ids]);
  for(const file of new Set(files)){if(path.basename(file)!==file)throw Error('Unsafe attachment cleanup name');const target=path.join(root,'backend/src/uploads',file);if(fs.existsSync(target))fs.unlinkSync(target)}
  await db.end();
  const report={run,prefix,checks:results,cleanup:'Disposable QA accounts, projects, tasks, and uploaded files removed',skipped:['Live SMTP delivery','Google OAuth sign-in','Groq external API']};
  fs.mkdirSync(path.dirname(reportPath),{recursive:true});
  fs.writeFileSync(reportPath,JSON.stringify(report,null,2));
  if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
  console.log(JSON.stringify({passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length,cleanup:report.cleanup}));
 }
}
main().catch(e=>{console.error('WORKFLOW ERROR: '+e.message);process.exitCode=1});
