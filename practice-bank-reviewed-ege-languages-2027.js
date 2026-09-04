(()=>{
'use strict';
const PB=window.practiceBank=window.practiceBank||{};
const S='author-reviewed',spec='FIPI-project-2027';
function base(id,task,topic,q,type='text',answer='',ex='',extra={}){return{id:`${id}-reviewed-${String(task).padStart(2,'0')}`,task,topic,q,type,answer,ex,source:S,spec,...extra}}
const cfg={
 'ege-english':{lang:'English',read:'Read the text and answer the question.',gram:['She ___ to school every day.','goes','Present Simple with she → goes.'],lex:['Choose the closest synonym to “rapid”.','fast','Rapid = fast.'],write:'Write an email reply to a friend, answering all questions and asking three questions on the stated topic.',project:'Prepare a written project response based on the given table/chart: compare the data, identify a problem and suggest a solution.',speak:'Speak on the stated topic in a logically structured answer.'},
 'ege-german':{lang:'Deutsch',read:'Lesen Sie den Text und beantworten Sie die Frage.',gram:['Sie ___ jeden Tag zur Schule.','geht','Mit „sie“ im Singular: geht.'],lex:['Wählen Sie ein Synonym für „schnell“.','rasch','„rasch“ ist ein Synonym für „schnell“.'],write:'Schreiben Sie eine E-Mail-Antwort: beantworten Sie alle Fragen und stellen Sie drei eigene Fragen.',project:'Verfassen Sie eine schriftliche Projektantwort zu einer Tabelle/Grafik: vergleichen Sie Daten, nennen Sie ein Problem und schlagen Sie eine Lösung vor.',speak:'Sprechen Sie zum vorgegebenen Thema zusammenhängend und logisch.'},
 'ege-french':{lang:'Français',read:'Lisez le texte et répondez à la question.',gram:['Elle ___ à l’école chaque jour.','va','Avec «elle», le verbe aller → va.'],lex:['Choisissez un synonyme de «rapide».','vite','«vite» convient dans ce prototype lexical.'],write:'Rédigez une réponse à un courriel: répondez à toutes les questions et posez trois questions.',project:'Rédigez une réponse de projet à partir d’un tableau/graphique: comparez les données, identifiez un problème et proposez une solution.',speak:'Parlez du sujet proposé de façon structurée.'},
 'ege-spanish':{lang:'Español',read:'Lea el texto y responda a la pregunta.',gram:['Ella ___ a la escuela cada día.','va','Con «ella», ir → va.'],lex:['Elija un sinónimo de «rápido».','veloz','«veloz» es sinónimo de «rápido».'],write:'Escriba una respuesta a un correo: conteste todas las preguntas y formule tres preguntas propias.',project:'Redacte una respuesta de proyecto a partir de una tabla/gráfico: compare datos, señale un problema y proponga una solución.',speak:'Hable sobre el tema propuesto de forma coherente y estructurada.'}
};
for(const [id,c] of Object.entries(cfg)){
 const a=[];
 for(let t=1;t<=9;t++)a.push(base(id,t,'Аудирование',`Задание ${t}. Требуется оригинальная аудиодорожка тренировочного варианта ${c.lang}. После прослушивания выберите/введите ответ по содержанию.`, 'essay','', 'Аудиирование нельзя достоверно заменить текстом.',{requiresAudio:true,criteria:'До подключения аудиофайла задание используется только как маркер структуры и не должно автоматически оцениваться.'}));
 for(let t=10;t<=18;t++)a.push(base(id,t,'Чтение',`${c.read} Прототип ${t}: определите основную мысль/соответствие утверждения содержанию.`, 'text','основная мысль текста','Тренируется извлечение явной и неявной информации из текста.',{requiresPassage:true}));
 for(let t=19;t<=27;t++)a.push(base(id,t,'Грамматика',`${c.gram[0]} (прототип линии ${t})`,'text',c.gram[1],c.gram[2]));
 for(let t=28;t<=36;t++)a.push(base(id,t,'Лексика',`${c.lex[0]} (прототип линии ${t})`,'text',c.lex[1],c.lex[2]));
 a.push(base(id,37,'Письменная речь',c.write,'essay','', 'Проверяется содержание, организация, языковое оформление.',{criteria:'Выполнить все коммуникативные задачи, соблюдать формат и объём, использовать связный и грамотный язык.'}));
 a.push(base(id,38,'Письменная речь: проект',c.project,'essay','', 'Требуется анализ данных, сравнение, проблема и решение.',{criteria:'Введение; 2–3 факта из данных; сравнение; проблема; решение; заключение.'}));
 for(let t=39;t<=42;t++)a.push(base(id,t,'Устная часть',`${c.speak} Прототип устной линии ${t}.`,'essay','', 'Требуется устный ответ; текстовое поле используется только для подготовки плана.',{requiresSpeaking:true,criteria:'Содержание; логика; лексика и грамматика; произношение. Для полноценной проверки нужна запись голоса.'}));
 PB[id]=a;
}
// Китайский язык имеет отдельную структуру и меньшее число заданий.
const zh=[];
for(let t=1;t<=7;t++)zh.push(base('ege-chinese',t,'Аудирование',`听力任务 ${t}：需要配套音频。根据录音内容完成任务。`,'essay','', 'Без аудиофайла это только маркер структуры.',{requiresAudio:true,criteria:'Не оценивать автоматически до подключения аудиодорожки.'}));
for(let t=8;t<=15;t++)zh.push(base('ege-chinese',t,'Чтение',`阅读任务 ${t}：阅读短文并确定主要内容或信息对应关系。`,'text','根据短文','Требуется работа с исходным текстом.',{requiresPassage:true}));
for(let t=16;t<=26;t++)zh.push(base('ege-chinese',t,'Лексика и грамматика',`语言任务 ${t}：选择或写出符合语境的词语/语法形式。`,'text','根据语境','Проверяется лексико-грамматическая норма.'));
zh.push(base('ege-chinese',27,'Письмо','根据给出的交际情境写一封完整的书面回复。','essay','', 'Проверяются коммуникативная задача и языковое оформление.',{criteria:'Содержание, структура, лексика, грамматика, иероглифика.'}));
zh.push(base('ege-chinese',28,'Письменное высказывание','根据数据或问题写一段有结构的书面表达。','essay','', 'Нужен связный аргументированный текст.',{criteria:'Раскрытие темы, логика, языковое оформление.'}));
for(let t=29;t<=32;t++)zh.push(base('ege-chinese',t,'Устная часть',`口语任务 ${t}：根据题目进行口头表达。`,'essay','', 'Для полноценной проверки требуется запись голоса.',{requiresSpeaking:true,criteria:'Содержание, логика, лексика/грамматика, произношение.'}));
PB['ege-chinese']=zh;
})();