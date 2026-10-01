-- ===========================================================================
-- Frasevia — contenido inicial
--
-- Dos mazos oficiales, de solo lectura para quienes usan la aplicación.
-- Los identificadores son fijos para que el seed sea idempotente: se puede
-- aplicar más de una vez sin duplicar nada.
--
-- Los mazos oficiales no tienen autor (author_id = null); eso es justamente lo
-- que los hace inmodificables: ninguna política permite escribirlos.
-- ===========================================================================

insert into public.decks (
  id, author_id, title, slug, description, source_language, target_language,
  level, visibility, is_official
)
values (
  'a1000000-0000-4000-8000-000000000001',
  null,
  'Inglés desde las bases',
  'ingles-desde-las-bases',
  'Saludos, presentaciones, preguntas básicas, números y los verbos que usas todos los días. Ideal para retomar el inglés donde lo dejaste.',
  'es',
  'en',
  'Primeros pasos',
  'public',
  true
)
on conflict (id) do nothing;

insert into public.decks (
  id, author_id, title, slug, description, source_language, target_language,
  level, visibility, is_official
)
values (
  'a1000000-0000-4000-8000-000000000002',
  null,
  'Inglés para desarrolladores',
  'ingles-para-desarrolladores',
  'Frases para presentarte en el trabajo, explicar lo que haces, hablar de una tarea, describir un error y prepararte para una entrevista.',
  'es',
  'en',
  'Intermedio',
  'public',
  true
)
on conflict (id) do nothing;

insert into public.cards (
  id, deck_id, kind, term, meaning_es, example_en, example_es, usage_note, tags, position
)
values
  -- ---------------------------------------------------------------------
  -- Inglés desde las bases (20)
  -- ---------------------------------------------------------------------
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'phrase',
   'Hello!', '¡Hola!',
   'Hello! It is nice to see you here.',
   '¡Hola! Qué bueno verte por aquí.',
   'Se usa tanto para saludar a una persona como al contestar el teléfono.',
   '{saludos}', 1),

  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'phrase',
   'Nice to meet you.', 'Mucho gusto. / Encantado de conocerte.',
   'Nice to meet you, I am Camila.',
   'Mucho gusto, soy Camila.',
   'Solo la primera vez que te presentan. Después usa "Nice to see you again".',
   '{saludos, presentaciones}', 2),

  ('b1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', 'phrase',
   'How are you doing?', '¿Cómo estás?',
   'How are you doing? It has been a while.',
   '¿Cómo estás? Hacía mucho que no nos veíamos.',
   'Respuesta de cortesía: "I am doing well, thank you. And you?"',
   '{saludos, preguntas}', 3),

  ('b1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000001', 'question',
   'What is your name?', '¿Cómo te llamas?',
   'What is your name, and where are you from?',
   '¿Cómo te llamas y de dónde eres?',
   'No se dice "How do you call?".',
   '{presentaciones, preguntas}', 4),

  ('b1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000001', 'phrase',
   'Nice to see you again.', 'Qué bueno verte de nuevo.',
   'Nice to see you again! How was your trip?',
   '¡Qué bueno verte de nuevo! ¿Cómo fue el viaje?',
   'Es la versión para un segundo encuentro, no para la primera presentación.',
   '{saludos}', 5),

  ('b1000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000001', 'rule',
   'I am', 'soy / estoy',
   'I am from Valparaíso and I work in technology.',
   'Soy de Valparaíso y trabajo en tecnología.',
   'Se abrevia a "I am" como "I''m" en casi todos los casos.',
   '{verbo to be}', 6),

  ('b1000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000001', 'question',
   'Where are you from?', '¿De dónde eres?',
   'Where are you from, and what do you do there?',
   '¿De dónde eres y a qué te dedicas allí?',
   'Habla del lugar de origen o de procedencia, no de dónde estás ahora.',
   '{presentaciones, preguntas}', 7),

  ('b1000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000001', 'phrase',
   'Thank you very much.', 'Muchas gracias.',
   'Thank you very much for waiting for me.',
   'Muchas gracias por esperarme.',
   'En textos escritos se abrevia a "Thanks a lot" o simplemente "Thanks".',
   '{cortesía}', 8),

  ('b1000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000001', 'phrase',
   'Could you say that again, please?', '¿Podrías repetirlo, por favor?',
   'Could you say that again, please? It is a little loud in here.',
   '¿Podrías repetirlo, por favor? Aquí hay mucho ruido.',
   'Es más amable que "Say it again".',
   '{cortesía, peticiones}', 9),

  ('b1000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000001', 'phrase',
   'I am sorry, I did not catch that.', 'Lo siento, no te entendí.',
   'I am sorry, I did not catch that. Could you repeat it?',
   'Lo siento, no te entendí. ¿Podrías repetirlo?',
   'Muy natural para decir "no alcancé a oír lo que dijiste".',
   '{cortesía, conversación}', 10),

  ('b1000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000001', 'phrase',
   'Excuse me, where is the train station?', 'Disculpe, ¿dónde está la estación de tren?',
   'Excuse me, where is the train station? Is it far from here?',
   'Disculpe, ¿dónde está la estación de tren? ¿Está lejos de aquí?',
   'Se usa para atraer la atención de alguien o para pasar entre gente.',
   '{cortesía, viajes}', 11),

  ('b1000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000001', 'question',
   'How much does it cost?', '¿Cuánto cuesta?',
   'Excuse me, how much does this jacket cost?',
   'Disculpe, ¿cuánto cuesta esta chaqueta?',
   'Cuando preguntas el precio de un solo objeto: "How much is it?"',
   '{compras, preguntas}', 12),

  ('b1000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000001', 'question',
   'What time is it now?', '¿Qué hora es ahora?',
   'Excuse me, what time is it now? I have a meeting at three.',
   'Disculpe, ¿qué hora es? Tengo una reunión a las tres.',
   'Para la hora exacta de un encuentro: "What time do we meet?"',
   '{horarios, preguntas}', 13),

  ('b1000000-0000-4000-8000-000000000014', 'a1000000-0000-4000-8000-000000000001', 'question',
   'What do you do for a living?', '¿A qué te dedicas?',
   'What do you do for a living? I work as a nurse at a clinic.',
   '¿A qué te dedicas? Trabajo de enfermera en una clínica.',
   'Es la forma natural de preguntar por la profesión de otra persona.',
   '{presentaciones, trabajo}', 14),

  ('b1000000-0000-4000-8000-000000000015', 'a1000000-0000-4000-8000-000000000001', 'phrase',
   'I would like a coffee, please.', 'Me gustaría un café, por favor.',
   'I would like a coffee, please. To go, thank you.',
   'Me gustaría un café, por favor. Para llevar, gracias.',
   '"I would like" suena más amable que "I want", que puede sonar impaciente.',
   '{pedidos, cortesía}', 15),

  ('b1000000-0000-4000-8000-000000000016', 'a1000000-0000-4000-8000-000000000001', 'question',
   'Can I ask you something quick?', '¿Puedo preguntarte algo rápido?',
   'Can I ask you something quick? It will only take a minute.',
   '¿Puedo preguntarte algo rápido? Te toma solo un minuto.',
   'Se usa "Can I...?" para pedir permiso antes de preguntar.',
   '{preguntas, cortesía}', 16),

  ('b1000000-0000-4000-8000-000000000017', 'a1000000-0000-4000-8000-000000000001', 'phrase',
   'Of course, go ahead.', 'Claro, adelante.',
   'Can I sit here? Of course, go ahead.',
   '¿Puedo sentarme aquí? Claro, adelante.',
   'Se responde con "go ahead" cuando alguien pide permiso para hacer algo.',
   '{respuestas, cortesía}', 17),

  ('b1000000-0000-4000-8000-000000000018', 'a1000000-0000-4000-8000-000000000001', 'phrase',
   'I do not understand this word.', 'No entiendo esta palabra.',
   'I do not understand this word. Could you spell it for me?',
   'No entiendo esta palabra. ¿Podrías deletrearla?',
   'También sirve "I don''t understand", que es más coloquial.',
   '{conversación, aprendizaje}', 18),

  ('b1000000-0000-4000-8000-000000000019', 'a1000000-0000-4000-8000-000000000001', 'phrase',
   'See you later!', '¡Hasta luego!',
   'It was really good talking with you. See you later!',
   'Estuvo muy buena la conversación. ¡Hasta luego!',
   'Con amigos o compañeros de trabajo. Con desconocidos se usa "Goodbye".',
   '{despedidas}', 19),

  ('b1000000-0000-4000-8000-000000000020', 'a1000000-0000-4000-8000-000000000001', 'rule',
   'at seven o''clock', 'a las siete',
   'The meeting starts at seven o''clock, so I will be a little early.',
   'La reunión empieza a las siete, así que llegaré un poco antes.',
   'La hora siempre va con "at". En preguntas: "What time does it start?"',
   '{horarios, regla}', 20),

  -- ---------------------------------------------------------------------
  -- Inglés para desarrolladores (12)
  -- ---------------------------------------------------------------------
  ('b2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002', 'phrase',
   'I am a backend developer.', 'Soy desarrolladora de backend.',
   'I am a backend developer and I have been working with this team for a year.',
   'Soy desarrolladora de backend y llevo un año trabajando con este equipo.',
   'Se presenta con "I am a..." o con "I work as a...", que suena más natural al hablar.',
   '{presentación, trabajo}', 1),

  ('b2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 'phrase',
   'I work on a payments platform.', 'Trabajo en una plataforma de pagos.',
   'Right now I work on a payments platform used by small businesses.',
   'Ahora mismo trabajo en una plataforma de pagos para pymes.',
   'Describe el producto, no solo la tecnología: va mejor en una entrevista.',
   '{presentación, proyecto}', 2),

  ('b2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002', 'phrase',
   'The goal of the project is to reduce load times.', 'El objetivo del proyecto es reducir los tiempos de carga.',
   'The goal of the project is to reduce load times on slower connections.',
   'El objetivo del proyecto es reducir los tiempos de carga en conexiones lentas.',
   'Presenta el proyecto con "the goal of X is to..." y luego explica el beneficio.',
   '{proyecto, explaining}', 3),

  ('b2000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002', 'phrase',
   'I am currently working on...', 'Ahora mismo estoy trabajando en...',
   'I am currently working on the checkout flow, so I have context if you need it.',
   'Ahora mismo estoy trabajando en el flujo de pago, así que tengo contexto si lo necesitas.',
   '"Currently" o "right now" marcan que tu trabajo está en curso y es lo que se puede mover.',
   '{tareas, proyecto}', 4),

  ('b2000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000002', 'phrase',
   'Could you clarify what you mean by that?', '¿Podrías aclarar a qué te refieres con eso?',
   'Could you clarify what you mean by that? I want to make sure I got it right.',
   '¿Podrías aclarar a qué te refieres con eso? Quiero asegurarme de entender bien.',
   'Se usa cuando entendiste algo pero no estás seguro. "What do you mean?" es más directo.',
   '{tareas, preguntas}', 5),

  ('b2000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000002', 'phrase',
   'There is a bug in the login flow.', 'Hay un error en el flujo de inicio de sesión.',
   'There is a bug in the login flow: users get signed out after a refresh.',
   'Hay un error en el flujo de inicio de sesión: los usuarios quedan desconectados tras actualizar.',
   'Describe el síntoma antes de la causa. La estructura "There is a bug in..." ordena el reporte.',
   '{bugs, troubleshooting}', 6),

  ('b2000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000002', 'phrase',
   'I am still reproducing it.', 'Todavía lo estoy reproduciendo.',
   'I am still reproducing it locally. I will let you know once I narrow it down.',
   'Todavía lo estoy reproduciendo en local. Te aviso en cuanto lo ubique.',
   'Reproducir un error es el paso previo a encontrar la causa.',
   '{bugs, troubleshooting}', 7),

  ('b2000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000002', 'phrase',
   'I agree with your approach.', 'Estoy de acuerdo con tu enfoque.',
   'I agree with your approach, and I would add one small thing to the plan.',
   'Estoy de acuerdo con tu enfoque, y agregaría una cosa pequeña al plan.',
   'Estar de acuerdo y aun así aportar algo va muy bien en una entrevista.',
   '{reuniones, feedback}', 8),

  ('b2000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000002', 'phrase',
   'Let me walk you through the steps.', 'Déjame explicarte los pasos.',
   'Let me walk you through the steps so we can find where it fails.',
   'Déjame explicarte los pasos para poder ubicar dónde falla.',
   '"Walk me through" significa explicar algo paso a paso.',
   '{reuniones, debugging}', 9),

  ('b2000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000002', 'phrase',
   'I am looking for a role where I can grow.', 'Busco un puesto donde pueda crecer.',
   'I am looking for a role where I can grow and learn from a bigger team.',
   'Busco un puesto donde pueda crecer y aprender de un equipo más grande.',
   'Responde a la pregunta clásica "Where do you see yourself in five years?".',
   '{entrevista, objetivos}', 10),

  ('b2000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000002', 'phrase',
   'What does a typical day look like?', '¿Cómo es un día típico?',
   'What does a typical day look like for the team? I would like to know the rhythm.',
   '¿Cómo es un día típico para el equipo? Me gustaría conocer el ritmo.',
   'Buena pregunta para mostrar interés real y hacer buena impresión.',
   '{entrevista, preguntas}', 11),

  ('b2000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000002', 'phrase',
   'Could you tell me about a challenge you faced?', '¿Podrías contarme un desafío que enfrentaste?',
   'Could you tell me about a challenge you faced and how you solved it?',
   '¿Podrías contarme un desafío que enfrentaste y cómo lo resolviste?',
   'Prepara la respuesta con la estructura situación, tarea y resultado.',
   '{entrevista, preguntas}', 12)
on conflict (id) do nothing;
