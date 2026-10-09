const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Открыть меню');navigation.classList.remove('is-open');}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');navigation.classList.toggle('is-open',open);});
navigation.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();}});

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const sections = document.querySelectorAll('.reveal');
if (!reducedMotion.matches) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {entry.target.classList.add('is-visible'); observer.unobserve(entry.target);}
  }), {threshold: .08});
  sections.forEach(section => observer.observe(section));
}
const steps = document.querySelector('.steps');
const gallery = document.querySelector('.gallery-viewport');
const track = document.querySelector('.gallery-track');
const pauseButton = document.querySelector('#gallery-pause');
const cards = [...track.children];
cards.forEach(card => {const clone=card.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.tabIndex=-1;clone.dataset.clone='true';track.append(clone);});
let loopWidth=0, autoPaused=false, pointerOver=false, galleryFocused=false, touching=false, galleryVisible=false;
let fractionalPixels=0, scrollEnergy=0, speed=0, previousScroll=scrollY, lastFrame=0, manualUntil=0;
const updateWidth=()=>{loopWidth=track.children[cards.length].offsetLeft-track.children[0].offsetLeft;};
new ResizeObserver(updateWidth).observe(track);updateWidth();
new IntersectionObserver(([entry])=>{galleryVisible=entry.isIntersecting;},{rootMargin:'50px'}).observe(gallery);
function updatePause(){const paused=autoPaused || reducedMotion.matches;pauseButton.setAttribute('aria-pressed',String(paused));pauseButton.innerHTML=paused?'Продолжить ленту <span aria-hidden="true">▷</span>':'Приостановить ленту <span aria-hidden="true">Ⅱ</span>';}
autoPaused = reducedMotion.matches || !finePointer.matches;
updatePause();
pauseButton.addEventListener('click',()=>{if(reducedMotion.matches){autoPaused=true;pauseButton.textContent='Движение отключено в настройках';return;}autoPaused=!autoPaused;updatePause();});
function shiftGallery(direction){autoPaused=true;updatePause();manualUntil=performance.now()+800;if(direction<0 && gallery.scrollLeft<1)gallery.scrollLeft=loopWidth;gallery.scrollBy({left:direction*(cards[0].getBoundingClientRect().width+12),behavior:reducedMotion.matches?'instant':'smooth'});}
document.querySelector('#gallery-prev').addEventListener('click',()=>shiftGallery(-1));
document.querySelector('#gallery-next').addEventListener('click',()=>shiftGallery(1));
gallery.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();shiftGallery(event.key==='ArrowRight'?1:-1);}});
gallery.addEventListener('pointerenter',()=>{pointerOver=true;});gallery.addEventListener('pointerleave',()=>{pointerOver=false;});
gallery.addEventListener('focusin',()=>{galleryFocused=true;});gallery.addEventListener('focusout',event=>{galleryFocused=gallery.contains(event.relatedTarget);});
gallery.addEventListener('touchstart',()=>{touching=true;autoPaused=true;updatePause();},{passive:true});gallery.addEventListener('touchend',()=>{touching=false;},{passive:true});
gallery.addEventListener('wheel',()=>{autoPaused=true;updatePause();},{passive:true});
window.addEventListener('scroll',()=>{scrollEnergy=Math.min(25,Math.abs(scrollY-previousScroll));previousScroll=scrollY;},{passive:true});
const cursor=document.querySelector('.cursor');
const symbol=document.querySelector('.link-symbol');
let mouseX=0,mouseY=0,cursorX=0,cursorY=0,hasPointer=false;
window.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;mouseX=event.clientX;mouseY=event.clientY;if(!hasPointer){cursorX=mouseX;cursorY=mouseY;}hasPointer=true;cursor.classList.add('visible');cursor.classList.toggle('active',!!event.target.closest('a,button,input,textarea,label'));},{passive:true});
document.documentElement.addEventListener('pointerleave',()=>{hasPointer=false;cursor.classList.remove('visible');});
function frame(time){
 const dt=Math.min(32,time-lastFrame||16.7);lastFrame=time;
 if(!document.hidden){
   if(!reducedMotion.matches){
    const rect=steps.getBoundingClientRect();
    steps.style.setProperty('--progress',Math.max(0,Math.min(1,(innerHeight*.88-rect.top)/(innerHeight*.45))));
    if(finePointer.matches && hasPointer){cursorX+=(mouseX-cursorX)*.12;cursorY+=(mouseY-cursorY)*.12;cursor.style.transform=`translate3d(${cursorX}px,${cursorY}px,0)`;const box=symbol.getBoundingClientRect();if(box.bottom>0&&box.top<innerHeight)symbol.style.transform=`translate(${(mouseX/innerWidth-.5)*10}px,${(mouseY/innerHeight-.5)*8}px) rotate(${(mouseX/innerWidth-.5)*4}deg)`;}
    const target=galleryVisible && !autoPaused && !pointerOver && !galleryFocused && !touching ? 28+scrollEnergy*.3*60:0;
    speed+=(target-speed)*.06;scrollEnergy*=.92;
    if(target && speed>.1){fractionalPixels+=speed*dt/1000;const pixels=Math.floor(fractionalPixels);if(pixels){gallery.scrollLeft+=pixels;fractionalPixels-=pixels;}}
   }
   if(loopWidth && !galleryFocused && !touching && time>manualUntil && gallery.scrollLeft>=loopWidth)gallery.scrollLeft-=loopWidth;
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){autoPaused=true;document.documentElement.classList.remove('js-motion');cursor.classList.remove('visible');symbol.style.transform='';}updatePause();});
finePointer.addEventListener('change',()=>{if(!finePointer.matches){autoPaused=true;updatePause();}});

const form=document.querySelector('#lead-form');
const status=document.querySelector('#form-status');
const config=window.ZVENO_CONFIG || {};
if(config.leadEndpoint && config.privacyReady)status.textContent='Заполните обязательные поля — имя и телефон.';
document.addEventListener('click',event=>{
 const service=event.target.closest('[data-service]');
 if(service){const comment=form.elements.comment;const previous=comment.dataset.selection;const selection=`Интересует: ${service.dataset.service}.`;comment.value=previous&&comment.value.startsWith(previous)?comment.value.replace(previous,selection):selection+(comment.value?'\n'+comment.value:'');comment.dataset.selection=selection;setTimeout(()=>form.elements.name.focus({preventScroll:true}),reducedMotion.matches?0:600);}
});
function validateField(field){
 let message='';
 if(field.name==='name' && field.value.trim().length<2)message='Введите имя — не менее 2 символов.';
 if(field.name==='phone' && (!/^[+\d\s()\-]+$/.test(field.value)||!/^\d{10,15}$/.test(field.value.replace(/\D/g,''))))message='Введите телефон: от 10 до 15 цифр.';
 if(field.name==='consent' && !field.checked)message='Подтвердите согласие на обработку данных.';
 const error=document.querySelector(`#${field.name}-error`);
 if(error)error.textContent=message;
 field.setAttribute('aria-invalid',String(!!message));return !message;
}
['name','phone','consent'].forEach(name=>{const field=form.elements[name];field.addEventListener('blur',()=>{if(field.value || field.getAttribute('aria-invalid')==='true')validateField(field);});field.addEventListener(name==='consent'?'change':'input',()=>{if(field.getAttribute('aria-invalid')==='true')validateField(field);});});
form.addEventListener('submit',async event=>{
 event.preventDefault();status.className='form-status';
 const fields=['name','phone','consent'].map(name=>form.elements[name]);
 const invalid=fields.filter(field=>!validateField(field));
 if(invalid.length){status.textContent='Проверьте выделенные поля. Заявка не отправлена.';status.classList.add('is-error');invalid[0].focus();return;}
 if(!config.leadEndpoint || !config.privacyReady){status.textContent='Приём заявок пока не подключён. Ваши данные не отправлены.';status.classList.add('is-error');return;}
 let endpoint;
 try{endpoint=new URL(config.leadEndpoint,location.origin);if(endpoint.protocol!=='https:' && endpoint.origin!==location.origin)throw new Error();}catch{status.textContent='Приём заявок временно недоступен. Данные не отправлены.';status.classList.add('is-error');return;}
 const submit=form.querySelector('[type=submit]');const label=submit.innerHTML;submit.disabled=true;submit.textContent='Отправляем…';form.setAttribute('aria-busy','true');status.textContent='Пожалуйста, подождите.';
 try{
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:form.elements.name.value.trim(),phone:form.elements.phone.value.trim(),company:form.elements.company.value.trim(),comment:form.elements.comment.value.trim(),consent:form.elements.consent.checked,website:form.elements.website.value}),signal:AbortSignal.timeout(15000)});
 const result=await response.json();
 if(!response.ok || result.ok!==true)throw new Error();
 status.textContent='Заявка отправлена. Спасибо! Свяжемся с вами для обсуждения задачи.';status.classList.add('is-success');form.reset();delete form.elements.comment.dataset.selection;
 }catch{status.textContent='Не удалось подтвердить отправку. Проверьте соединение или попробуйте позже. Поля сохранены.';status.classList.add('is-error');}
 finally{submit.disabled=false;submit.innerHTML=label;form.removeAttribute('aria-busy');}
});
const dialog=document.querySelector('#privacy-dialog');
let previousFocus;
document.querySelectorAll('.policy-open').forEach(button=>button.addEventListener('click',()=>{previousFocus=button;dialog.showModal();}));
document.querySelectorAll('.dialog-close,.dialog-done').forEach(button=>button.addEventListener('click',()=>dialog.close()));
dialog.addEventListener('click',event=>{if(event.target===dialog){const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();}});
dialog.addEventListener('close',()=>previousFocus?.focus());
document.querySelector('#year').textContent=new Date().getFullYear();
