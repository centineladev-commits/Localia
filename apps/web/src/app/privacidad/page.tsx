import { PageWrapper } from "@/components/layout/PageWrapper";

export const metadata = {
  title: "Política de privacidad — Localia",
};

const sections = [
  {
    title: "1. Datos recopilados",
    content:
      "Localia recopila los datos que el usuario facilita al registrarse (nombre, correo electrónico, dirección de entrega), así como datos de uso generados durante la navegación por la plataforma (páginas visitadas, búsquedas realizadas, interacciones con anuncios).",
  },
  {
    title: "2. Uso de datos",
    content:
      "Los datos personales se utilizan para gestionar la cuenta del usuario, procesar pedidos, enviar comunicaciones transaccionales y, previo consentimiento expreso, comunicaciones comerciales. No cedemos datos a terceros salvo para la prestación del propio servicio (proveedores de pago, logística) o cuando la ley lo exija.",
  },
  {
    title: "3. Cookies",
    content:
      "Utilizamos cookies técnicas necesarias para el funcionamiento de la plataforma y, con tu consentimiento, cookies analíticas y de personalización. Puedes gestionar tus preferencias en cualquier momento desde el panel de configuración de cookies.",
  },
  {
    title: "4. Derechos del usuario",
    content:
      "En virtud del Reglamento (UE) 2016/679 (RGPD) y la LOPDGDD, el usuario tiene derecho a acceder, rectificar, suprimir, limitar el tratamiento, portabilidad y oposición al tratamiento de sus datos. Para ejercerlos escribe a privacidad@localia.es adjuntando copia de tu documento de identidad.",
  },
  {
    title: "5. Contacto con el DPO",
    content:
      "Hemos designado un Delegado de Protección de Datos (DPO) al que puedes dirigirte para cualquier cuestión relacionada con el tratamiento de tus datos personales. Puedes contactar con el DPO en dpo@localia.es.",
  },
];

export default function PrivacidadPage() {
  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Política de privacidad
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
