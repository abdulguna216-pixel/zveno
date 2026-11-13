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
cards.forEach(card => {const clone=card.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.dataset.clone='true';track.append(clone);});
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
const symbol=document.querySelector('.link-symbol');
let mouseX=0,mouseY=0,hasPointer=false;
window.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;mouseX=event.clientX;mouseY=event.clientY;hasPointer=true;},{passive:true});
document.documentElement.addEventListener('pointerleave',()=>{hasPointer=false;});
function frame(time){
 const dt=Math.min(32,time-lastFrame||16.7);lastFrame=time;
 if(!document.hidden){
   if(!reducedMotion.matches){
    const rect=steps.getBoundingClientRect();
    steps.style.setProperty('--progress',Math.max(0,Math.min(1,(innerHeight*.88-rect.top)/(innerHeight*.45))));
    if(finePointer.matches && hasPointer){const box=symbol.getBoundingClientRect();if(box.bottom>0&&box.top<innerHeight)symbol.style.transform=`translate(${(mouseX/innerWidth-.5)*10}px,${(mouseY/innerHeight-.5)*8}px) rotate(${(mouseX/innerWidth-.5)*4}deg)`;}
    const target=galleryVisible && !autoPaused && !pointerOver && !galleryFocused && !touching ? 28+scrollEnergy*.3*60:0;
    speed+=(target-speed)*.06;scrollEnergy*=.92;
    if(target && speed>.1){fractionalPixels+=speed*dt/1000;const pixels=Math.floor(fractionalPixels);if(pixels){gallery.scrollLeft+=pixels;fractionalPixels-=pixels;}}
   }
   if(loopWidth && !galleryFocused && !touching && time>manualUntil && gallery.scrollLeft>=loopWidth)gallery.scrollLeft-=loopWidth;
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){autoPaused=true;document.documentElement.classList.remove('js-motion');symbol.style.transform='';}updatePause();});
finePointer.addEventListener('change',()=>{if(!finePointer.matches){autoPaused=true;updatePause();}});

document.querySelector('#year').textContent=new Date().getFullYear();

const serviceDetails = {
  warehouse: 'Предоставляем сотрудников для приёмки, размещения, хранения и отгрузки товара. Они перемещают продукцию между зонами склада и помогают с пересчётом остатков. Состав команды подбираем с учётом объёма работ и графика смен.',
  production: 'Подбираем персонал для сборки, сортировки и упаковки продукции, а также для вспомогательных операций на производственной линии. Учитываем требования к навыкам сотрудников, график смен и особенности вашего участка.',
  packing: 'Комплектовщики собирают заказы по спискам и проверяют позиции и количество товара. Упаковщики подбирают тару, упаковывают и маркируют заказы, затем передают их в зону отгрузки.',
  loading: 'Предоставляем грузчиков для погрузки, разгрузки, перемещения и укладки товаров и материалов. Разнорабочие помогают подготовить рабочие зоны и выполняют подсобные работы на складе или производстве. Состав команды зависит от задач объекта и объёма работ.'
};
const serviceDialog = document.querySelector('#service-dialog');
const serviceDialogTitle = document.querySelector('#service-dialog-title');
const serviceDialogDescription = document.querySelector('#service-dialog-description');
const serviceDialogLabel = document.querySelector('#service-dialog-label');
let serviceDialogTrigger;

for (const button of document.querySelectorAll('[data-service-detail]')) {
  button.addEventListener('click', () => {
    const card = button.closest('.service-card');
    serviceDialogTrigger = button;
    serviceDialogTitle.textContent = card.querySelector('h3').textContent;
    serviceDialogLabel.textContent = `${card.querySelector('.card-number').textContent} / Услуги`;
    serviceDialogDescription.textContent = serviceDetails[button.dataset.serviceDetail];
    serviceDialog.showModal();
  });
}
serviceDialog.querySelector('.service-dialog-close').addEventListener('click', () => serviceDialog.close());
let backdropPressed = false;
const isServiceBackdrop = event => {
  const {left, right, top, bottom} = serviceDialog.getBoundingClientRect();
  return event.target === serviceDialog && (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom);
};
serviceDialog.addEventListener('pointerdown', event => {backdropPressed = isServiceBackdrop(event);});
serviceDialog.addEventListener('click', event => {
  if (backdropPressed && isServiceBackdrop(event)) serviceDialog.close();
  backdropPressed = false;
});
serviceDialog.addEventListener('close', () => {
  if (!serviceDialog.open && (document.activeElement === document.body || serviceDialog.contains(document.activeElement))) {
    serviceDialogTrigger?.focus({preventScroll:true});
  }
});
