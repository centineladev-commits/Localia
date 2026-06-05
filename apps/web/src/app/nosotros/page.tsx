import { PageWrapper } from "@/components/layout/PageWrapper";

export const metadata = {
  title: "Quiénes somos — Localia",
};

const values = [
  {
    title: "Local",
    description:
      "Conectamos a compradores con los comercios de su barrio. Cada compra fortalece la economía de tu comunidad.",
  },
  {
    title: "Transparente",
    description:
      "Sin intermediarios ocultos ni tarifas sorpresa. Los vendedores y compradores saben exactamente qué esperan el uno del otro.",
  },
  {
    title: "Sostenible",
    description:
      "Comprar local reduce desplazamientos y embalajes. Menos huella de carbono, más conexión con tu entorno.",
  },
];

export default function NosotrosPage() {
  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-14">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Somos Localia</h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Localia nació con una idea simple: que comprar cerca de casa fuera tan
            fácil como comprar en cualquier gran plataforma. Conectamos a comercios
            locales con los vecinos que los rodean, creando un mercado de barrio
            digital accesible para todos.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed mt-4">
            Fundada en 2024, trabajamos con cientos de tiendas en distintas ciudades
            para que sus productos lleguen a quienes viven a pocos minutos de ellas.
          </p>
        </div>

        {/* Mission */}
        <div className="mb-14">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Nuestra misión</h2>
          <p className="text-slate-600 leading-relaxed">
            Hacer que el comercio local sea la primera opción, no la última. Queremos
            que cada vecino descubra la riqueza de los negocios que tiene a su alrededor
            y que cada comerciante cuente con las herramientas digitales que necesita
            para crecer sin depender de grandes plataformas ajenas a su realidad.
          </p>
        </div>

        {/* Values */}
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Nuestros valores</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm"
              >
                <h3 className="font-semibold text-indigo-600 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
