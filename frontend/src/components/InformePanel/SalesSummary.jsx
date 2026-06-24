// components/informes/SalesSummary.js
import { ToastContainer, toast, Bounce } from 'react-toastify';
import axios from "axios";

export default function SalesSummary({ summary, period }) {
  if (!summary) return null;

  console.log("period:", period);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // formato 24h (opcional)
    });
  };

  const cards = [
    {
      title: "Total de Órdenes",
      value: summary.total_orders?.toLocaleString() || "0",
      icon: "📋",
      color: "bg-blue-500",
    },
    {
      title: "Ingresos Totales",
      value: formatCurrency(summary.total_revenue),
      icon: "💰",
      color: "bg-green-500",
    },
    {
      title: "Promedio por Orden",
      value: formatCurrency(summary.average_order_value),
      icon: "📊",
      color: "bg-purple-500",
    },
    {
      title: "Órdenes Delivery",
      value: summary.delivery_orders?.toLocaleString() || "0",
      icon: "🚚",
      color: "bg-orange-500",
    },
    {
      title: "Ingresos Delivery",
      value: formatCurrency(summary.total_delivery_revenue),
      icon: "🛵",
      color: "bg-indigo-500",
    },
  ];

  // Tarjetas para métodos de pago
  const paymentCards = [
    {
      title: "Ventas con Tarjeta",
      count: summary.card_orders || 0,
      revenue: summary.card_revenue || 0,
      icon: "💳",
      color: "bg-blue-600",
    },
    {
      title: "Ventas con Transferencia",
      count: summary.transfer_orders || 0,
      revenue: summary.transfer_revenue || 0,
      icon: "🏦",
      color: "bg-green-600",
    },
    {
      title: "Ventas en Efectivo",
      count: summary.cash_orders || 0,
      revenue: summary.cash_revenue || 0,
      icon: "💵",
      color: "bg-gray-600",
    },
  ];

   const printSummary = async () => {
    try {
      const cleanSummary = {
        total_orders: summary.total_orders,
        total_revenue: summary.total_revenue,
        average_order_value: summary.average_order_value,
        delivery_orders: summary.delivery_orders,
        total_delivery_revenue: summary.total_delivery_revenue,
        card_orders: summary.card_orders,
        card_revenue: summary.card_revenue,
        transfer_orders: summary.transfer_orders,
        transfer_revenue: summary.transfer_revenue,
        cash_orders: summary.cash_orders,
        cash_revenue: summary.cash_revenue,
      };

      const cleanPeriod = {
        start_date: period?.start_date,
        end_date: period?.end_date,
      };

      const payload = {
        summary: cleanSummary,
        period: cleanPeriod,
      };

      console.log("Imprimiendo resumen del día:", payload);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/printer/print-summary`,
        payload,
        {
          withCredentials: true,
        }
      );

      console.log("Respuesta del backend (resumen):", response.data);

      toast.success("Resumen impreso correctamente!", {
        position: "bottom-center",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
    } catch (error) {
      console.error("Error al imprimir resumen:", error);
      alert("Error al imprimir resumen del día");
    }
  };

  return (
    <div className="bg-gray-100 rounded-lg shadow-md p-6">
      <div className="mt-6 flex justify-end">
        <button
          onClick={printSummary}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          🖨️ Imprimir Resumen del Día
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Resumen de Ventas
        </h2>
        {period && (
          <p className="text-gray-600 text-sm">
            Período: {formatDate(period.start_date)} -{" "}
            {formatDate(period.end_date)}
          </p>
        )}
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-lg bg-white border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-md ${card.color} flex items-center justify-center text-white text-sm`}
                >
                  {card.icon}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {card.title}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {card.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sección de métodos de pago */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Ventas por Método de Pago
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paymentCards.map((card, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-lg bg-white border border-gray-200 p-6"
            >
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-md ${card.color} flex items-center justify-center text-white text-sm`}
                  >
                    {card.icon}
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    {card.title}
                  </h4>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cantidad:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {card.count.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ingresos:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(card.revenue)}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Promedio:</span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatCurrency(
                        card.count > 0 ? card.revenue / card.count : 0
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className="pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {summary.delivery_orders > 0
                ? (
                    (summary.delivery_orders / summary.total_orders) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
            <div className="text-gray-600">Órdenes con Delivery</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {summary.total_delivery_revenue > 0
                ? formatCurrency(
                    summary.total_delivery_revenue /
                      (summary.delivery_orders || 1)
                  )
                : formatCurrency(0)}
            </div>
            <div className="text-gray-600">Promedio Costo Delivery</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {period
                ? (() => {
                    const days =
                      Math.ceil(
                        (new Date(period.end_date) -
                          new Date(period.start_date)) /
                          (1000 * 60 * 60 * 24)
                      ) + 1;
                    return (summary.total_orders / days).toFixed(1);
                  })()
                : "0"}
            </div>
            <div className="text-gray-600">Órdenes por Día</div>
          </div>
        </div>
      </div>
      <div className="flex justify-end mb-4"></div>
    </div>
  );
}
