const SUPABASE_URL = 'https://xhhgtvigzhqymvpiszfm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable__4aKwkr9HfGZJMETc8_G7A_U04UodJQ';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = x => document.getElementById(x);
let vehicles = [];
let activeCompany = '';

function days(x){let a=new Date();a.setHours(0,0,0,0);return Math.ceil((new Date(x+'T00:00:00')-a)/86400000)}
function date(x){return x?new Intl.DateTimeFormat('tr-TR').format(new Date(x+'T00:00:00')):'-'}
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function normalize(x){return String(x??'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'')}
function toast(x){$('toast').textContent=x;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2200)}
function status(v){let d=days(v.expiry_date);return d<0?['expired','SÜRESİ GEÇMİŞ','expired-card']:d<=30?['soon','30 GÜN İÇİNDE','soon-card']:['ok','GEÇERLİ','']}

function vehicleCard(v){
  let d=days(v.expiry_date),s=status(v);
  return `<article class="card ${s[2]}"><div class="head"><div><h3>${esc(v.plate)}</h3><div class="company">${esc(v.company)}</div></div><span class="badge ${s[0]==='soon'?'soon-badge':s[0]}">${s[1]}</span></div><div class="info"><div class="item"><small>Ruhsat Seri No</small><b>${esc(v.serial_no||'-')}</b></div><div class="item"><small>Konum</small><b>${esc(v.location||'-')}</b></div><div class="item"><small>Muayene Yapılış</small><b>${date(v.inspection_date)}</b></div><div class="item"><small>Muayene Bitiş</small><b>${date(v.expiry_date)}</b></div></div>${v.notes?`<div class="notes">${esc(v.notes)}</div>`:''}<div class="foot"><span>${d<0?Math.abs(d)+' gün önce doldu':d===0?'Bugün bitiyor':d+' gün kaldı'}</span><div class="buttons"><button class="edit" onclick="editV('${v.id}')">Düzenle</button><button class="del" onclick="deleteV('${v.id}')">Sil</button></div></div></article>`
}

function updateStats(list=vehicles){
  let total=list.length, expired=list.filter(v=>days(v.expiry_date)<0).length, soon=list.filter(v=>days(v.expiry_date)>=0&&days(v.expiry_date)<=30).length;
  $('total').textContent=total;$('valid').textContent=total-soon-expired;$('soon').textContent=soon;$('expired').textContent=expired;
}

async function loadVehicles(){
  const {data,error}=await supabaseClient.from('vehicles').select('*').order('company').order('plate');
  if(error){console.error(error);toast('Araçlar yüklenemedi: '+error.message);return false}
  vehicles=data||[];return true;
}

async function render(){
  const q=normalize($('search').value);
  updateStats(vehicles);
  const matching=vehicles.filter(v=>[v.company,v.plate,v.serial_no,v.location,v.notes].some(x=>normalize(x).includes(q)));

  if(q){
    $('dashboardView').classList.add('hidden');$('companyView').classList.remove('hidden');activeCompany='';
    let exp=matching.filter(v=>days(v.expiry_date)<0).length;
    let soonMatch=matching.filter(v=>days(v.expiry_date)>=0&&days(v.expiry_date)<=30).length;
    $('detailCompanyName').textContent='Arama Sonuçları';
    $('detailCompanyMeta').textContent=`${matching.length} araç bulundu · “${$('search').value.trim()}”`;
    $('detailTotal').textContent=matching.length;$('detailValid').textContent=matching.length-exp-soonMatch;$('detailSoon').textContent=soonMatch;$('detailExpired').textContent=exp;
    $('addCompanyVehicle').classList.add('hidden');
    $('detailList').innerHTML=matching.length?matching.map(vehicleCard).join(''):`<section class="empty"><div>🔎</div><h2>Arama sonucu bulunamadı</h2><p>Farklı bir plaka, şirket, seri no veya konum deneyebilirsin.</p></section>`;
    return;
  }

  $('dashboardView').classList.remove('hidden');$('companyView').classList.add('hidden');$('addCompanyVehicle').classList.remove('hidden');
  let groups={};vehicles.forEach(v=>{let key=v.company.trim()||'Şirket belirtilmemiş';(groups[key]??=[]).push(v)});
  let names=Object.keys(groups).sort((a,b)=>a.localeCompare(b,'tr-TR'));
  $('companyCount').textContent=`${names.length} şirket`;
  $('list').innerHTML=names.map(name=>{let list=groups[name],exp=list.filter(v=>days(v.expiry_date)<0).length,soon=list.filter(v=>days(v.expiry_date)>=0&&days(v.expiry_date)<=30).length;return `<article class="company-card" data-company="${encodeURIComponent(name)}"><span class="company-icon">🏢</span><div class="company-info"><h3>${esc(name)}</h3><p>${list.length} araç kayıtlı</p><div class="company-status"><span class="mini valid">${list.length-exp-soon} geçerli</span>${soon?`<span class="mini soon">${soon} yaklaşan</span>`:''}${exp?`<span class="mini expired">${exp} geçmiş</span>`:''}</div></div><span class="company-arrow">→</span></article>`}).join('');
  $('empty').classList.toggle('hidden',vehicles.length>0);
}

function openCompany(name){activeCompany=name;$('dashboardView').classList.add('hidden');$('companyView').classList.remove('hidden');renderCompany(name)}
function renderCompany(name){let list=vehicles.filter(v=>(v.company.trim()||'Şirket belirtilmemiş')===name);let exp=list.filter(v=>days(v.expiry_date)<0).length,soon=list.filter(v=>days(v.expiry_date)>=0&&days(v.expiry_date)<=30).length;$('detailCompanyName').textContent=name;$('detailCompanyMeta').textContent=`${list.length} araç · Muayene durumları ve kayıt detayları`;$('detailTotal').textContent=list.length;$('detailValid').textContent=list.length-exp-soon;$('detailSoon').textContent=soon;$('detailExpired').textContent=exp;$('detailList').innerHTML=list.length?list.map(vehicleCard).join(''):`<section class="empty"><div>🚘</div><h2>Bu şirkette araç yok</h2><p>Yeni araç ekleyerek başlayabilirsin.</p></section>`}
function backCompanies(){if($('search').value.trim())$('search').value='';$('companyView').classList.add('hidden');$('dashboardView').classList.remove('hidden');activeCompany='';render()}
function openM(v,company){$('modal').classList.remove('hidden');$('modalTitle').textContent=v?'Aracı Düzenle':'Araç Ekle';$('id').value=v?.id||'';$('company').value=v?.company||company||'';$('plate').value=v?.plate||'';$('serial').value=v?.serial_no||'';$('location').value=v?.location||'';$('inspection').value=v?.inspection_date||'';$('expiry').value=v?.expiry_date||'';$('notes').value=v?.notes||''}
function closeM(){$('modal').classList.add('hidden');$('form').reset();$('id').value=''}

window.openCompany=openCompany;
window.editV=id=>openM(vehicles.find(v=>v.id===id));
window.deleteV=async id=>{
  if(!confirm('Bu aracı silmek istediğine emin misin?'))return;
  const {error}=await supabaseClient.from('vehicles').delete().eq('id',id);
  if(error){toast('Araç silinemedi: '+error.message);return}
  vehicles=vehicles.filter(v=>v.id!==id);activeCompany?renderCompany(activeCompany):render();toast('Araç silindi.');
};

$('loginForm').onsubmit=async e=>{
  e.preventDefault();
  const btn=e.submitter;btn.disabled=true;
  const {error}=await supabaseClient.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
  btn.disabled=false;
  if(error){toast('E-posta veya şifre hatalı.');return}
  $('loginScreen').classList.add('hidden');$('app').classList.remove('hidden');
  await loadVehicles();render();
};

$('logout').onclick=async()=>{await supabaseClient.auth.signOut();vehicles=[];activeCompany='';$('app').classList.add('hidden');$('loginScreen').classList.remove('hidden');$('email').value='';$('password').value=''};
$('add').onclick=()=>openM();$('addCompanyVehicle').onclick=()=>openM(null,activeCompany);$('backCompanies').onclick=backCompanies;$('close').onclick=closeM;$('cancel').onclick=closeM;
$('search').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();render()}};
$('list').onclick=e=>{let card=e.target.closest('.company-card');if(card)openCompany(decodeURIComponent(card.dataset.company))};

$('form').onsubmit=async e=>{
  e.preventDefault();
  const v={id:$('id').value||null,company:$('company').value.trim(),plate:$('plate').value.trim().toUpperCase(),serial_no:$('serial').value.trim(),location:$('location').value.trim(),inspection_date:$('inspection').value,expiry_date:$('expiry').value,notes:$('notes').value.trim()};
  if(!v.company||!v.plate||!v.inspection_date||!v.expiry_date)return toast('Zorunlu alanları doldur.');
  if(v.expiry_date<v.inspection_date)return toast('Bitiş tarihi yapılış tarihinden önce olamaz.');
  const btn=e.submitter;btn.disabled=true;
  let error,data;
  if(v.id){
    ({error}=await supabaseClient.from('vehicles').update({company:v.company,plate:v.plate,serial_no:v.serial_no||null,location:v.location||null,inspection_date:v.inspection_date,expiry_date:v.expiry_date,notes:v.notes||null,updated_at:new Date().toISOString()}).eq('id',v.id));
  }else{
    ({data,error}=await supabaseClient.from('vehicles').insert({company:v.company,plate:v.plate,serial_no:v.serial_no||null,location:v.location||null,inspection_date:v.inspection_date,expiry_date:v.expiry_date,notes:v.notes||null}).select().single());
  }
  btn.disabled=false;
  if(error){toast('Kayıt yapılamadı: '+error.message);return}
  closeM();await loadVehicles();
  if(activeCompany){if(v.company!==activeCompany)backCompanies();else renderCompany(activeCompany)}else render();
  toast(v.id?'Araç güncellendi.':'Araç eklendi.');
};

supabaseClient.auth.onAuthStateChange(async(_event,session)=>{
  if(session){$('loginScreen').classList.add('hidden');$('app').classList.remove('hidden');if(!vehicles.length){await loadVehicles();render()}}
  else{$('app').classList.add('hidden');$('loginScreen').classList.remove('hidden')}
});

(async()=>{
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(session){$('loginScreen').classList.add('hidden');$('app').classList.remove('hidden');await loadVehicles();render()}
})();
