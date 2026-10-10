// Definición de cada calculadora: campos, fórmula (se ejecuta en el navegador) y contenido.
import { YEAR, fmt } from './core.mjs';

// ------------------------------------------------------------- calculadoras
// `calc` se ejecuta en el navegador (se serializa a assets/tools.js): solo puede usar `fmt`.
export const CURRENCIES = ['USD', 'EUR', 'MXN', 'COP', 'ARS', 'CLP', 'PEN', 'BRL', 'UYU', 'BOB', 'PYG', 'DOP', 'GTQ', 'CRC', 'VES', 'GBP', 'CAD', 'JPY'].map(c => [c, c]);

// Colombia: SMMLV y auxilio de transporte 2026 (Decretos 1469 y 1470 de 2025). Actualizar cada enero.
export const CO = { smmlv: 1750905, aux: 249095 };
export const AUX_INPUT = { id: 'aux', label: 'Auxilio de transporte', type: 'select', value: 'auto', options: [['auto', 'Automático (si gana hasta 2 salarios mínimos)'], ['si', 'Sí recibe'], ['no', 'No recibe']] };
export const CO_NOTE = `<p class="muted">Valores ${YEAR}: salario mínimo $ ${fmt(CO.smmlv)} y auxilio de transporte $ ${fmt(CO.aux)}. Cálculo orientativo: no reemplaza la liquidación oficial de tu empleador ni la asesoría de un contador o abogado laboral.</p>`;

export const tools = [
  {
    slug: 'interes-compuesto', icon: '📈', name: 'Calculadora de interés compuesto',
    desc: 'Calcula cuánto crecerá tu dinero con interés compuesto y aportes mensuales. Gratis, al instante y sin registro.',
    intro: 'Descubre cuánto valdrá tu inversión en el futuro combinando un capital inicial, aportes mensuales y una tasa de interés anual.',
    inputs: [
      { id: 'capital', label: 'Capital inicial', value: 1000 },
      { id: 'aporte', label: 'Aporte mensual', value: 100 },
      { id: 'tasa', label: 'Tasa de interés anual (%)', value: 8 },
      { id: 'anios', label: 'Años', value: 10 },
    ],
    calc: ({ capital, aporte, tasa, anios }) => {
      if (!(anios > 0)) return null;
      const i = tasa / 100 / 12, n = Math.round(anios * 12);
      const fv = i ? capital * (1 + i) ** n + aporte * (((1 + i) ** n - 1) / i) : capital + aporte * n;
      const ap = capital + aporte * n;
      return Object.assign([['Valor final', fmt(fv)], ['Total aportado', fmt(ap)], ['Intereses ganados', fmt(fv - ap)]], { bars: [['Lo que aportas', ap], ['Intereses', fv - ap]] });
    },
    article: `<h2>¿Qué es el interés compuesto?</h2>
<p>El interés compuesto es el interés que se calcula sobre el capital inicial <em>y también</em> sobre los intereses acumulados de periodos anteriores. A diferencia del interés simple, tus ganancias generan nuevas ganancias, por eso el crecimiento se acelera con el tiempo.</p>
<h2>Fórmula utilizada</h2>
<p>Esta calculadora capitaliza mensualmente: <strong>VF = C × (1 + i)ⁿ + A × ((1 + i)ⁿ − 1) ÷ i</strong>, donde <em>C</em> es el capital inicial, <em>A</em> el aporte mensual, <em>i</em> la tasa anual dividida entre 12 y <em>n</em> el número de meses.</p>
<p>El factor más importante no es la tasa sino el tiempo: empezar cinco años antes suele pesar más que conseguir un par de puntos extra de rentabilidad.</p>`,
    faq: [
      ['¿Cada cuánto se capitalizan los intereses?', 'La calculadora asume capitalización mensual y aportes al final de cada mes, que es el caso más habitual en cuentas de ahorro y fondos.'],
      ['¿El resultado tiene en cuenta la inflación o los impuestos?', 'No. El valor final es nominal. Para estimar el valor real, resta la inflación esperada a la tasa de interés antes de calcular.'],
    ],
  },
  {
    slug: 'prestamo', icon: '🏦', name: 'Calculadora de préstamos y cuotas',
    desc: 'Calcula la cuota mensual de un préstamo, el total a pagar y los intereses. Sistema francés de cuota fija.',
    intro: 'Introduce el monto, la tasa de interés anual y el plazo para conocer tu cuota mensual fija y el costo total del crédito.',
    inputs: [
      { id: 'monto', label: 'Monto del préstamo', value: 10000 },
      { id: 'tasa', label: 'Tasa de interés anual (%)', value: 18 },
      { id: 'meses', label: 'Plazo (meses)', value: 36 },
    ],
    calc: ({ monto, tasa, meses }) => {
      if (!(meses > 0)) return null;
      const i = tasa / 100 / 12;
      const cuota = i ? (monto * i) / (1 - (1 + i) ** -meses) : monto / meses;
      return Object.assign([['Cuota mensual', fmt(cuota)], ['Total a pagar', fmt(cuota * meses)], ['Total de intereses', fmt(cuota * meses - monto)]], { bars: [['Capital', monto], ['Intereses', cuota * meses - monto]] });
    },
    article: `<h2>¿Cómo se calcula la cuota de un préstamo?</h2>
<p>La mayoría de créditos personales, hipotecarios y de vehículo usan el <strong>sistema francés</strong>: una cuota fija durante todo el plazo. Al principio la mayor parte de la cuota son intereses y, con el tiempo, cada vez se amortiza más capital.</p>
<p>La fórmula es <strong>Cuota = M × i ÷ (1 − (1 + i)⁻ⁿ)</strong>, donde <em>M</em> es el monto, <em>i</em> la tasa mensual (tasa anual nominal ÷ 12) y <em>n</em> el número de cuotas.</p>
<h2>Consejos antes de pedir un crédito</h2>
<p>Compara siempre el costo total (no solo la cuota), pregunta por seguros y comisiones que no están incluidos en la tasa, y verifica si puedes hacer abonos anticipados sin penalización: reducen mucho los intereses.</p>`,
    faq: [
      ['¿La tasa es nominal o efectiva?', 'La calculadora usa la tasa nominal anual dividida entre 12. Si tu banco te da una tasa efectiva anual, la cuota real será ligeramente menor.'],
      ['¿Incluye seguros y comisiones?', 'No. Solo calcula capital e intereses. Pide a la entidad el costo total del crédito para comparar ofertas.'],
    ],
  },
  {
    slug: 'meta-de-ahorro', icon: '🎯', name: 'Calculadora de meta de ahorro',
    desc: 'Calcula cuánto debes ahorrar cada mes para alcanzar tu meta en el plazo que elijas, con o sin intereses.',
    intro: 'Define tu objetivo, el plazo y la rentabilidad esperada, y te decimos cuánto necesitas apartar cada mes.',
    inputs: [
      { id: 'meta', label: 'Meta de ahorro', value: 20000 },
      { id: 'inicial', label: 'Ahorro que ya tienes', value: 0 },
      { id: 'tasa', label: 'Rentabilidad anual (%)', value: 5 },
      { id: 'anios', label: 'Años', value: 5 },
    ],
    calc: ({ meta, inicial, tasa, anios }) => {
      if (!(anios > 0)) return null;
      const i = tasa / 100 / 12, n = Math.round(anios * 12);
      const g = (1 + i) ** n;
      const ap = i ? ((meta - inicial * g) * i) / (g - 1) : (meta - inicial) / n;
      if (ap <= 0) return [['Aporte mensual necesario', '0'], ['Nota', 'Ya alcanzas tu meta sin aportes']];
      return [['Aporte mensual necesario', fmt(ap)], ['Total que aportarás', fmt(ap * n)], ['Intereses que te ayudan', fmt(meta - inicial - ap * n)]];
    },
    article: `<h2>Cómo usar la calculadora de meta de ahorro</h2>
<p>Escribe la cantidad que quieres reunir (la cuota inicial de una casa, un fondo de emergencia, un viaje), lo que ya tienes ahorrado y en cuántos años quieres lograrlo. Si tu dinero estará en una cuenta remunerada o un fondo, añade la rentabilidad anual esperada; si lo guardas sin intereses, pon 0.</p>
<p>Un buen punto de partida es el fondo de emergencia: entre tres y seis meses de tus gastos fijos. Después, automatiza el aporte el mismo día que recibes tu ingreso para no depender de la fuerza de voluntad.</p>`,
    faq: [['¿Qué rentabilidad debo poner?', 'Usa una cifra conservadora. Para cuentas de ahorro, la tasa que publica tu banco; para inversiones a largo plazo, muchas personas usan entre 4% y 7% anual.']],
  },
  {
    slug: 'porcentajes', icon: '％', name: 'Calculadora de porcentajes',
    desc: 'Calcula el porcentaje de cualquier cantidad, y el resultado de sumar o restar ese porcentaje. Fácil y rápido.',
    intro: 'Calcula al instante cuánto es un porcentaje de una cantidad, y cuánto queda al sumarlo o restarlo.',
    inputs: [
      { id: 'pct', label: 'Porcentaje (%)', value: 15 },
      { id: 'cantidad', label: 'Cantidad', value: 200 },
    ],
    calc: ({ pct, cantidad }) => {
      const r = (cantidad * pct) / 100;
      return [[`${fmt(pct)}% de ${fmt(cantidad)}`, fmt(r)], [`${fmt(cantidad)} + ${fmt(pct)}%`, fmt(cantidad + r)], [`${fmt(cantidad)} − ${fmt(pct)}%`, fmt(cantidad - r)]];
    },
    article: `<h2>¿Cómo se calcula un porcentaje?</h2>
<p>Para hallar el X% de una cantidad, multiplica la cantidad por X y divide entre 100. Por ejemplo, el 15% de 200 es 200 × 15 ÷ 100 = <strong>30</strong>.</p>
<p>Un truco mental: el 10% se obtiene moviendo la coma un lugar a la izquierda (10% de 200 = 20). A partir de ahí, el 5% es la mitad (10) y el 15% es la suma de ambos (30).</p>`,
    faq: [['¿Cómo calculo qué porcentaje es un número de otro?', 'Divide la parte entre el total y multiplica por 100. Por ejemplo, 30 de 200 es 30 ÷ 200 × 100 = 15%.']],
  },
  {
    slug: 'descuento', icon: '🏷️', name: 'Calculadora de descuentos',
    desc: 'Calcula el precio final con descuento y cuánto ahorras. Ideal para rebajas, Black Friday y ofertas.',
    intro: 'Escribe el precio original y el porcentaje de descuento para saber el precio final y tu ahorro.',
    inputs: [
      { id: 'precio', label: 'Precio original', value: 80 },
      { id: 'desc', label: 'Descuento (%)', value: 25 },
    ],
    calc: ({ precio, desc }) => Object.assign([['Precio final', fmt(precio * (1 - desc / 100))], ['Ahorras', fmt((precio * desc) / 100)]], { bars: [['Pagas', precio * (1 - desc / 100)], ['Ahorras', (precio * desc) / 100]] }),
    article: `<h2>Cómo calcular un descuento</h2>
<p>Multiplica el precio por el porcentaje de descuento y divide entre 100: ese es tu ahorro. Réstalo del precio original para obtener el precio final. Por ejemplo, un artículo de 80 con 25% de descuento cuesta 80 − 20 = <strong>60</strong>.</p>
<p>Ojo con los descuentos acumulados: un 20% más un 10% adicional no es un 30%, sino un 28%, porque el segundo descuento se aplica sobre el precio ya rebajado.</p>`,
    faq: [['¿Cómo saber el precio original a partir del precio rebajado?', 'Divide el precio rebajado entre (1 − descuento ÷ 100). Si pagaste 60 con un 25% de descuento: 60 ÷ 0,75 = 80.']],
  },
  {
    slug: 'iva', icon: '🧾', name: 'Calculadora de IVA',
    desc: 'Agrega o quita el IVA de cualquier importe. Válida para España, México, Colombia, Argentina, Chile, Perú y más.',
    intro: 'Calcula el precio con IVA o desglosa el impuesto de un precio que ya lo incluye. Ajusta la tasa a la de tu país.',
    inputs: [
      { id: 'monto', label: 'Importe', value: 100 },
      { id: 'tasa', label: 'Tasa de IVA (%)', value: 19 },
      { id: 'modo', label: 'Operación', type: 'select', value: 'add', options: [['add', 'Agregar IVA (el importe no lo incluye)'], ['rem', 'Quitar IVA (el importe ya lo incluye)']] },
    ],
    calc: ({ monto, tasa, modo }) => {
      const base = modo === 'add' ? monto : monto / (1 + tasa / 100);
      const iva = (base * tasa) / 100;
      return [[modo === 'add' ? 'Total con IVA' : 'Base sin IVA', fmt(modo === 'add' ? base + iva : base)], ['IVA', fmt(iva)], [modo === 'add' ? 'Base sin IVA' : 'Total con IVA', fmt(modo === 'add' ? base : base + iva)]];
    },
    article: `<h2>Tasa general de IVA por país</h2>
<table><tr><th>País</th><th>Tasa general</th></tr>
<tr><td>España</td><td>21%</td></tr><tr><td>México</td><td>16%</td></tr><tr><td>Colombia</td><td>19%</td></tr><tr><td>Chile</td><td>19%</td></tr>
<tr><td>Argentina</td><td>21%</td></tr><tr><td>Perú (IGV)</td><td>18%</td></tr><tr><td>Ecuador</td><td>15%</td></tr><tr><td>Uruguay</td><td>22%</td></tr>
<tr><td>Bolivia</td><td>13%</td></tr><tr><td>Paraguay</td><td>10%</td></tr><tr><td>República Dominicana (ITBIS)</td><td>18%</td></tr><tr><td>Costa Rica</td><td>13%</td></tr>
<tr><td>Guatemala</td><td>12%</td></tr><tr><td>Panamá (ITBMS)</td><td>7%</td></tr></table>
<p class="muted">Tasas generales de referencia; existen tasas reducidas y exenciones. Verifica siempre la tasa vigente con la autoridad tributaria de tu país.</p>
<h2>Cómo quitar el IVA de un precio</h2>
<p>No basta con restar el porcentaje: hay que dividir el total entre (1 + tasa ÷ 100). Con un IVA del 19%, un precio final de 119 tiene una base de 119 ÷ 1,19 = <strong>100</strong> y un IVA de 19.</p>`,
    faq: [['¿Por qué restar el 19% a un precio con IVA da un resultado incorrecto?', 'Porque el IVA se calculó sobre la base, no sobre el total. Restar el 19% de 119 da 96,39, cuando la base real es 100.']],
  },
  {
    slug: 'imc', icon: '⚖️', name: 'Calculadora de IMC',
    desc: 'Calcula tu índice de masa corporal (IMC) y conoce tu rango de peso saludable según la OMS.',
    intro: 'Introduce tu peso y tu estatura para conocer tu índice de masa corporal y en qué categoría te encuentras.',
    inputs: [
      { id: 'peso', label: 'Peso (kg)', value: 70 },
      { id: 'altura', label: 'Estatura (cm)', value: 170 },
    ],
    calc: ({ peso, altura }) => {
      if (!(altura > 0) || !(peso > 0)) return null;
      const m = altura / 100, imc = peso / (m * m);
      const cat = imc < 18.5 ? 'Bajo peso' : imc < 25 ? 'Peso normal' : imc < 30 ? 'Sobrepeso' : 'Obesidad';
      return Object.assign([['Tu IMC', fmt(imc, 1)], ['Categoría (OMS)', cat], ['Peso saludable para tu estatura', `${fmt(18.5 * m * m, 1)} – ${fmt(24.9 * m * m, 1)} kg`]], { marker: Math.min(100, Math.max(0, ((imc - 15) / 25) * 100)) });
    },
    article: `<h2>¿Qué es el IMC?</h2>
<p>El índice de masa corporal relaciona tu peso con tu estatura: <strong>IMC = peso (kg) ÷ estatura² (m)</strong>. La Organización Mundial de la Salud lo usa como indicador general para adultos.</p>
<table><tr><th>IMC</th><th>Categoría</th></tr><tr><td>Menos de 18,5</td><td>Bajo peso</td></tr><tr><td>18,5 – 24,9</td><td>Peso normal</td></tr><tr><td>25 – 29,9</td><td>Sobrepeso</td></tr><tr><td>30 o más</td><td>Obesidad</td></tr></table>
<p>El IMC no distingue entre grasa y músculo, ni aplica igual a niños, embarazadas o deportistas. Es una referencia, no un diagnóstico: consulta a un profesional de la salud.</p>`,
    faq: [['¿El IMC sirve para niños?', 'No directamente. En menores de 18 años se usan tablas de percentiles por edad y sexo.']],
  },
  {
    slug: 'regla-de-tres', icon: '✖️', name: 'Calculadora de regla de tres',
    desc: 'Resuelve reglas de tres simples directas al instante: si A es a B, entonces C es a X.',
    intro: 'Si A equivale a B, ¿a cuánto equivale C? Completa los tres valores y obtén X.',
    inputs: [
      { id: 'a', label: 'A', value: 5 },
      { id: 'b', label: 'B (equivale a A)', value: 20 },
      { id: 'c', label: 'C', value: 8 },
    ],
    calc: ({ a, b, c }) => (a ? [['X', fmt((b * c) / a, 4)], ['Operación', `${fmt(b, 4)} × ${fmt(c, 4)} ÷ ${fmt(a, 4)}`]] : null),
    article: `<h2>¿Cómo funciona la regla de tres?</h2>
<p>La regla de tres simple directa resuelve problemas de proporcionalidad: si 5 kilos cuestan 20, 8 kilos costarán X. Se multiplica en cruz y se divide: <strong>X = B × C ÷ A</strong> = 20 × 8 ÷ 5 = 32.</p>
<p>Sirve para recetas, escalas, precios por unidad, consumo de combustible y cualquier relación en la que, al aumentar una magnitud, la otra aumenta en la misma proporción.</p>`,
    faq: [['¿Y si la relación es inversa?', 'En una regla de tres inversa (por ejemplo, más trabajadores, menos días) la fórmula es X = A × B ÷ C.']],
  },
  {
    slug: 'propina', icon: '🍽️', name: 'Calculadora de propina',
    desc: 'Calcula la propina y divide la cuenta entre varias personas en segundos.',
    intro: 'Calcula cuánto dejar de propina y cuánto paga cada persona al dividir la cuenta.',
    inputs: [
      { id: 'cuenta', label: 'Total de la cuenta', value: 120 },
      { id: 'pct', label: 'Propina (%)', value: 10 },
      { id: 'personas', label: 'Personas', value: 4 },
    ],
    calc: ({ cuenta, pct, personas }) => {
      if (!(personas > 0)) return null;
      const p = (cuenta * pct) / 100;
      return [['Cada persona paga', fmt((cuenta + p) / personas)], ['Propina', fmt(p)], ['Total con propina', fmt(cuenta + p)]];
    },
    article: `<h2>¿Cuánto se deja de propina?</h2>
<p>Depende del país. En México y Colombia lo habitual es alrededor del 10%; en Estados Unidos entre el 15% y el 20%; en España y Argentina suele ser voluntaria y menor. Revisa si el servicio ya está incluido en la cuenta antes de sumarla.</p>`,
    faq: [],
  },
  {
    slug: 'dias-entre-fechas', icon: '📅', name: 'Calculadora de días entre fechas',
    desc: 'Cuenta cuántos días, semanas y meses hay entre dos fechas. Útil para plazos, vacaciones y eventos.',
    intro: 'Elige una fecha de inicio y una fecha final para saber exactamente cuántos días las separan.',
    inputs: [
      { id: 'desde', label: 'Desde', type: 'date', today: true },
      { id: 'hasta', label: 'Hasta', type: 'date' },
    ],
    calc: ({ desde, hasta }) => {
      if (!desde || !hasta) return null;
      const d = Math.round((Date.parse(hasta) - Date.parse(desde)) / 864e5);
      return [['Días', fmt(d)], ['Semanas', fmt(d / 7, 1)], ['Meses (aprox.)', fmt(d / 30.4375, 1)]];
    },
    article: `<h2>¿Cómo se cuentan los días entre dos fechas?</h2>
<p>La calculadora cuenta los días naturales (incluye fines de semana y festivos) desde la fecha inicial hasta la fecha final, sin incluir el día de inicio. Si la fecha final es anterior a la inicial, el resultado es negativo.</p>
<p>Es útil para calcular plazos de entrega, días que faltan para un viaje, duración de un contrato o semanas de embarazo.</p>`,
    faq: [['¿Tiene en cuenta los años bisiestos?', 'Sí. El cálculo se hace sobre el calendario real, así que el 29 de febrero se cuenta cuando corresponde.']],
  },
  {
    slug: 'edad', icon: '🎂', name: 'Calculadora de edad',
    desc: 'Calcula tu edad exacta en años, meses y días, y cuántos días faltan para tu próximo cumpleaños.',
    intro: 'Escribe tu fecha de nacimiento y descubre tu edad exacta y cuánto falta para tu cumpleaños.',
    inputs: [{ id: 'nacimiento', label: 'Fecha de nacimiento', type: 'date' }],
    calc: ({ nacimiento }) => {
      if (!nacimiento) return null;
      const [y, m, d] = nacimiento.split('-').map(Number);
      const now = new Date(), t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const b = new Date(y, m - 1, d);
      if (b > t) return null;
      let yy = t.getFullYear() - y, mm = t.getMonth() - (m - 1), dd = t.getDate() - d;
      if (dd < 0) { mm--; dd += new Date(t.getFullYear(), t.getMonth(), 0).getDate(); }
      if (mm < 0) { yy--; mm += 12; }
      let next = new Date(t.getFullYear(), m - 1, d);
      if (next < t) next = new Date(t.getFullYear() + 1, m - 1, d);
      return [['Edad', `${yy} años, ${mm} meses y ${dd} días`], ['Días vividos', fmt(Math.round((t - b) / 864e5))], ['Días para tu cumpleaños', fmt(Math.round((next - t) / 864e5))]];
    },
    article: `<h2>¿Cómo se calcula la edad exacta?</h2>
<p>Se restan el año, el mes y el día de nacimiento de la fecha de hoy. Si aún no ha llegado tu día o tu mes de cumpleaños en el año actual, se ajusta "pidiendo prestado" un mes o un año, igual que en una resta con llevadas.</p>`,
    faq: [],
  },
  {
    slug: 'conversor-de-divisas', icon: '💱', name: 'Conversor de divisas',
    desc: 'Convierte entre dólares, euros, pesos mexicanos, colombianos, argentinos, chilenos, soles y más con tasas actualizadas a diario.',
    intro: 'Convierte entre las principales monedas del mundo hispano con tipos de cambio de referencia actualizados cada día.',
    inputs: [
      { id: 'monto', label: 'Cantidad', value: 100 },
      { id: 'de', label: 'De', type: 'select', value: 'USD', options: CURRENCIES },
      { id: 'a', label: 'A', type: 'select', value: 'MXN', options: CURRENCIES },
    ],
    calc: async ({ monto, de, a }) => {
      const c = window.__fx || (window.__fx = {});
      if (!c[de]) c[de] = fetch('https://open.er-api.com/v6/latest/' + de).then(r => r.json());
      const d = await c[de], t = d.rates[a];
      return [[`${fmt(monto)} ${de} =`, `${fmt(monto * t)} ${a}`], ['Tipo de cambio', `1 ${de} = ${fmt(t, 4)} ${a}`], ['Actualizado', new Date(d.time_last_update_unix * 1000).toLocaleDateString('es')]];
    },
    article: `<h2>Sobre los tipos de cambio</h2>
<p>Las tasas mostradas son de referencia de mercado y se actualizan una vez al día. El tipo de cambio que te aplique tu banco, casa de cambio o tarjeta incluirá un margen o comisión, por lo que recibirás algo menos al comprar o vender divisas.</p>
<p class="muted">Tasas proporcionadas por <a href="https://www.exchangerate-api.com" rel="nofollow noopener" target="_blank">Exchange Rate API</a>.</p>`,
    faq: [['¿Puedo usar estas tasas para operaciones reales?', 'Son informativas. Antes de una operación consulta la tasa exacta con tu entidad financiera.']],
  },
  {
    slug: 'prima-de-servicios-colombia', group: 'laboral', icon: '🎁', name: `Calculadora de prima de servicios ${YEAR} (Colombia)`,
    desc: `Calcula tu prima de servicios de junio o diciembre de ${YEAR} en Colombia según tu salario y los días trabajados en el semestre.`,
    intro: 'Escribe tu salario mensual y los días trabajados en el semestre para saber cuánto debes recibir de prima.',
    inputs: [
      { id: 'salario', label: 'Salario mensual', value: CO.smmlv },
      AUX_INPUT,
      { id: 'dias', label: 'Días trabajados en el semestre', value: 180 },
    ],
    calc: ({ salario, aux, dias }) => {
      const base = salario + coAux(salario, aux);
      return [['Prima de servicios', cop((base * dias) / 360)], ['Base de liquidación', cop(base)], ['Días liquidados', fmt(dias)]];
    },
    article: `<h2>¿Cómo se calcula la prima de servicios?</h2>
<p>La prima equivale a un mes de salario por cada año trabajado, pagado en dos partes. La fórmula por semestre es <strong>(salario base × días trabajados en el semestre) ÷ 360</strong>. Un semestre completo son 180 días, así que quien trabajó los seis meses recibe medio salario.</p>
<p>La base incluye el auxilio de transporte cuando el trabajador tiene derecho a él, es decir, cuando gana hasta dos salarios mínimos. Si tu salario es variable (comisiones, horas extras), se usa el promedio del semestre.</p>
<h2>¿Cuándo se paga?</h2>
<p>La primera mitad se paga a más tardar el 30 de junio y la segunda dentro de los primeros 20 días de diciembre.</p>${CO_NOTE}`,
    faq: [
      ['¿Quién tiene derecho a la prima?', 'Todos los trabajadores con contrato laboral, incluidos los del servicio doméstico y los de tiempo parcial. No aplica a contratistas por prestación de servicios ni a quienes tienen salario integral.'],
      ['¿Qué pasa si no trabajé el semestre completo?', 'Se paga proporcional a los días trabajados. Con 90 días recibirías la mitad de la prima de un semestre completo.'],
    ],
  },
  {
    slug: 'cesantias-colombia', group: 'laboral', icon: '🏠', name: `Calculadora de cesantías e intereses ${YEAR} (Colombia)`,
    desc: `Calcula tus cesantías y los intereses sobre las cesantías de ${YEAR} en Colombia a partir de tu salario y días trabajados.`,
    intro: 'Calcula cuánto te corresponde de cesantías y de intereses según tu salario y los días trabajados en el año.',
    inputs: [
      { id: 'salario', label: 'Salario mensual', value: CO.smmlv },
      AUX_INPUT,
      { id: 'dias', label: 'Días trabajados en el año', value: 360 },
    ],
    calc: ({ salario, aux, dias }) => {
      const ces = ((salario + coAux(salario, aux)) * dias) / 360;
      const int = (ces * dias * 0.12) / 360;
      return [['Cesantías', cop(ces)], ['Intereses sobre cesantías', cop(int)], ['Total', cop(ces + int)]];
    },
    article: `<h2>Fórmulas</h2>
<p><strong>Cesantías = (salario base × días trabajados) ÷ 360.</strong> Equivalen a un mes de salario por cada año trabajado. La base incluye el auxilio de transporte si tienes derecho a él.</p>
<p><strong>Intereses = (cesantías × días trabajados × 0,12) ÷ 360.</strong> Son el 12% anual sobre el saldo de cesantías, proporcional al tiempo trabajado.</p>
<h2>Fechas clave</h2>
<p>El empleador debe pagarte los intereses directamente a más tardar el 31 de enero, y consignar las cesantías en tu fondo antes del 15 de febrero del año siguiente.</p>${CO_NOTE}`,
    faq: [['¿Para qué puedo retirar las cesantías?', 'Mientras estés empleado, para compra, construcción o mejora de vivienda y para educación. Al terminar el contrato puedes retirarlas libremente.']],
  },
  {
    slug: 'liquidacion-colombia', group: 'laboral', icon: '📄', name: `Calculadora de liquidación laboral ${YEAR} (Colombia)`,
    desc: `Calcula tu liquidación de contrato en Colombia ${YEAR}: cesantías, intereses, prima de servicios y vacaciones pendientes.`,
    intro: 'Estima las prestaciones que deben pagarte al terminar tu contrato: cesantías, intereses, prima y vacaciones.',
    inputs: [
      { id: 'salario', label: 'Salario mensual', value: CO.smmlv },
      AUX_INPUT,
      { id: 'diasAnio', label: 'Días trabajados en el año (cesantías)', value: 360 },
      { id: 'diasSem', label: 'Días trabajados en el semestre (prima)', value: 180 },
      { id: 'diasVac', label: 'Días trabajados sin disfrutar vacaciones', value: 360 },
    ],
    calc: ({ salario, aux, diasAnio, diasSem, diasVac }) => {
      const base = salario + coAux(salario, aux);
      const ces = (base * diasAnio) / 360, int = (ces * diasAnio * 0.12) / 360;
      const prima = (base * diasSem) / 360, vac = (salario * diasVac) / 720;
      return Object.assign([['Total liquidación', cop(ces + int + prima + vac)], ['Cesantías', cop(ces)], ['Intereses sobre cesantías', cop(int)], ['Prima de servicios', cop(prima)], ['Vacaciones', cop(vac)]], { bars: [['Cesantías', ces], ['Intereses', int], ['Prima', prima], ['Vacaciones', vac]] });
    },
    article: `<h2>¿Qué incluye la liquidación?</h2>
<p>Al terminar un contrato laboral, el empleador debe pagar las prestaciones causadas y no pagadas:</p>
<ul><li><strong>Cesantías:</strong> (salario base × días del año) ÷ 360.</li>
<li><strong>Intereses sobre cesantías:</strong> (cesantías × días × 0,12) ÷ 360.</li>
<li><strong>Prima de servicios:</strong> (salario base × días del semestre) ÷ 360.</li>
<li><strong>Vacaciones:</strong> (salario × días pendientes) ÷ 720. Aquí no se incluye el auxilio de transporte.</li></ul>
<p>Esta calculadora no incluye el salario de los últimos días trabajados, la indemnización por despido sin justa causa ni descuentos por préstamos; súmalos o réstalos según tu caso.</p>${CO_NOTE}`,
    faq: [
      ['¿Cuánto tiempo tiene el empleador para pagar la liquidación?', 'Debe pagarla al terminar el contrato. Si se retrasa sin justificación puede generarse una sanción moratoria a favor del trabajador.'],
      ['¿La liquidación incluye indemnización?', 'Solo si el despido fue sin justa causa. Su valor depende del tipo de contrato y del tiempo trabajado, y no está incluida en este cálculo.'],
    ],
  },
  {
    slug: 'salario-neto-colombia', group: 'laboral', icon: '💵', name: `Calculadora de salario neto ${YEAR} (Colombia)`,
    desc: `Calcula cuánto recibes realmente en Colombia en ${YEAR} después de los descuentos de salud, pensión y fondo de solidaridad.`,
    intro: 'Escribe tu salario mensual y conoce cuánto llega a tu cuenta después de los descuentos de ley.',
    inputs: [
      { id: 'salario', label: 'Salario mensual', value: 3000000 },
      AUX_INPUT,
    ],
    calc: ({ salario, aux }) => {
      const n = salario / CO.smmlv;
      const tasa = n < 4 ? 0 : n < 16 ? 1 : n <= 17 ? 1.2 : n <= 18 ? 1.4 : n <= 19 ? 1.6 : n <= 20 ? 1.8 : 2;
      const salud = salario * 0.04, pension = salario * 0.04, fsp = (salario * tasa) / 100, ax = coAux(salario, aux);
      return Object.assign([['Salario neto', cop(salario - salud - pension - fsp + ax)], ['Salud (4%)', '− ' + cop(salud)], ['Pensión (4%)', '− ' + cop(pension)], [`Fondo de solidaridad (${fmt(tasa, 1)}%)`, '− ' + cop(fsp)], ['Auxilio de transporte', '+ ' + cop(ax)]], { bars: [['Recibes', salario - salud - pension - fsp + ax], ['Salud', salud], ['Pensión', pension], ['Solidaridad', fsp]] });
    },
    article: `<h2>Descuentos de ley sobre el salario</h2>
<p>A todo trabajador dependiente se le descuenta el <strong>4% para salud</strong> y el <strong>4% para pensión</strong>. El empleador aporta por su parte el 8,5% y el 12% respectivamente, que no salen de tu salario.</p>
<p>Quienes ganan cuatro salarios mínimos o más aportan además al <strong>Fondo de Solidaridad Pensional</strong>: 1% entre 4 y 16 salarios mínimos, y de 1,2% a 2% por encima de ese nivel.</p>
<p>El cálculo no incluye la retención en la fuente, que solo aplica a salarios altos y depende de tus deducciones personales, ni descuentos voluntarios como libranzas o aportes a cooperativas.</p>${CO_NOTE}`,
    faq: [['¿Cuánto es el salario mínimo neto?', `Con el mínimo de ${YEAR} ($ ${fmt(CO.smmlv)}) se descuentan $ ${fmt(CO.smmlv * 0.08, 0)} de salud y pensión y se suman $ ${fmt(CO.aux)} de auxilio de transporte: recibes $ ${fmt(CO.smmlv * 0.92 + CO.aux, 0)}.`]],
  },
  {
    slug: 'horas-extras-colombia', group: 'laboral', icon: '⏱️', name: `Calculadora de horas extras y recargos ${YEAR} (Colombia)`,
    desc: `Calcula el valor de tus horas extras diurnas y nocturnas y de los recargos nocturnos, dominicales y festivos en Colombia ${YEAR}.`,
    intro: 'Indica tu salario y las horas trabajadas de cada tipo para saber cuánto deben pagarte adicional este mes.',
    inputs: [
      { id: 'salario', label: 'Salario mensual', value: CO.smmlv },
      { id: 'divisor', label: 'Horas mensuales de la jornada', value: 210 },
      { id: 'hed', label: 'Horas extras diurnas', value: 4 },
      { id: 'hen', label: 'Horas extras nocturnas', value: 0 },
      { id: 'rn', label: 'Horas ordinarias nocturnas', value: 0 },
      { id: 'df', label: 'Horas ordinarias en domingo o festivo', value: 0 },
    ],
    calc: ({ salario, divisor, hed, hen, rn, df }) => {
      if (!(divisor > 0)) return null;
      const h = salario / divisor;
      const a = hed * h * 1.25, b = hen * h * 1.75, c = rn * h * 0.35, d = df * h * 0.9;
      return [['Total adicional a pagar', cop(a + b + c + d)], ['Valor de la hora ordinaria', cop(h)], ['Extras diurnas (+25%)', cop(a)], ['Extras nocturnas (+75%)', cop(b)], ['Recargo nocturno (35%)', cop(c)], ['Recargo dominical/festivo (90%)', cop(d)]];
    },
    article: `<h2>Porcentajes vigentes</h2>
<table><tr><th>Concepto</th><th>Recargo sobre la hora ordinaria</th></tr>
<tr><td>Hora extra diurna</td><td>25%</td></tr><tr><td>Hora extra nocturna</td><td>75%</td></tr>
<tr><td>Recargo nocturno (7:00 p. m. a 6:00 a. m.)</td><td>35%</td></tr>
<tr><td>Recargo dominical o festivo</td><td>90% (desde el 1 de julio de 2026; 100% desde julio de 2027)</td></tr></table>
<h2>Valor de la hora ordinaria</h2>
<p>Se obtiene dividiendo el salario mensual entre las horas mensuales de la jornada. Con la jornada máxima de 42 horas semanales, vigente desde el 15 de julio de 2026, el divisor habitual es <strong>210</strong> (antes era 220). Si tu jornada pactada es distinta, cambia ese valor.</p>
<p>Las horas extras se pagan completas con su recargo (hora × 1,25 o × 1,75). En las horas ordinarias nocturnas o dominicales solo se suma el recargo, porque la hora ya está incluida en tu salario. Si el domingo no hace parte de tu jornada habitual, además del recargo deben pagarte la hora o darte un descanso compensatorio.</p>${CO_NOTE}`,
    faq: [['¿Cuántas horas extras se pueden trabajar?', 'Como regla general, máximo 2 horas diarias y 12 a la semana.']],
  },
  {
    slug: 'aguinaldo-mexico', group: 'laboral', icon: '🎄', name: `Calculadora de aguinaldo ${YEAR} (México)`,
    desc: `Calcula tu aguinaldo ${YEAR} en México, completo o proporcional a los días trabajados en el año.`,
    intro: 'Escribe tu salario mensual y los días trabajados en el año para saber cuánto te corresponde de aguinaldo.',
    inputs: [
      { id: 'salario', label: 'Salario mensual bruto', value: 12000 },
      { id: 'diasAg', label: 'Días de aguinaldo', value: 15 },
      { id: 'dias', label: 'Días trabajados en el año', value: 365 },
    ],
    calc: ({ salario, diasAg, dias }) => {
      const diario = salario / 30;
      return [['Aguinaldo', '$ ' + fmt((diario * diasAg * dias) / 365)], ['Salario diario', '$ ' + fmt(diario)], ['Días de aguinaldo proporcionales', fmt((diasAg * dias) / 365, 1)]];
    },
    article: `<h2>¿Cómo se calcula el aguinaldo?</h2>
<p>La Ley Federal del Trabajo establece un aguinaldo mínimo de <strong>15 días de salario</strong>, que debe pagarse antes del 20 de diciembre. Muchas empresas y el sector público otorgan más días; revisa tu contrato y cambia el valor si es tu caso.</p>
<p>Fórmula: <strong>salario diario × días de aguinaldo × días trabajados ÷ 365</strong>. Si no trabajaste el año completo, o ya no trabajas en la empresa, tienes derecho a la parte proporcional.</p>
<p>El resultado es bruto: una parte del aguinaldo está exenta de ISR y sobre el excedente tu empleador retiene el impuesto.</p>
<p class="muted">Cálculo orientativo; no reemplaza la liquidación oficial de tu empleador.</p>`,
    faq: [['¿Qué pasa si no me pagan el aguinaldo?', 'Puedes acudir a la PROFEDET para recibir asesoría gratuita y reclamarlo; tienes un año para hacerlo.']],
  },
];
