import { PageWrapper } from "@/components/layout/PageWrapper";

export const metadata = {
  title: "Términos y condiciones — Localia",
};

const sections = [
  {
    title: "1. Objeto",
    content:
      "Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma Localia, un mercado digital que conecta a compradores y vendedores locales. Al utilizar el servicio, el usuario acepta estos términos en su totalidad.",
  },
  {
    title: "2. Usuarios",
    content:
      "Para registrarse en Localia es necesario ser mayor de 18 años o contar con el consentimiento de un tutor legal. El usuario es responsable de mantener la confidencialidad de sus credenciales y de toda la actividad realizada desde su cuenta.",
  },
  {
    title: "3. Vendedores",
    content:
      "Los comercios que publiquen productos en Localia se comprometen a ofrecer información veraz, a gestionar sus pedidos en los plazos indicados y a cumplir con la normativa vigente en materia de comercio electrónico y protección del consumidor.",
  },
  {
    title: "4. Pagos",
    content:
      "Los pagos se procesan a través de proveedores de pago certificados. Localia no almacena datos de tarjetas bancarias. En caso de devolución, el importe se reembolsará según la política de cada vendedor y en ningún caso más tarde de 14 días naturales.",
  },
  {
    title: "5. Responsabilidad",
    content:
      "Localia actúa como intermediario entre compradores y vendedores y no es responsable de los productos ofrecidos ni de las transacciones realizadas entre particulares. No obstante, ponemos a disposición de los usuarios un servicio de mediación en caso de conflicto.",
  },
  {
    title: "6. Ley aplicable",
    content:
      "Estos Términos se rigen por la legislación española. Para cualquier controversia derivada del uso de la plataforma, las partes se someten a los juzgados y tribunales de la ciudad de Madrid, salvo que la normativa de consumo establezca un fuero diferente.",
  },
];

export default function TerminosPage() {
  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Términos y condiciones
        </h1>
        <p className="text-sm text-slate-400 mb-12">Última actualización: enero 2025</p>

        <div className="space-y-10">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">{s.title}</h2>
              <p className="text-slate-600 leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
