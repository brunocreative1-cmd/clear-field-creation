/**
 * 📊 Gráfico de Funil de Conversão
 */

export default function FunnelChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Não há dados de funil disponíveis
      </div>
    )
  }

  const maxCount = Math.max(...data.map(step => step.count))

  return (
    <div className="space-y-4">
      {data.map((step, index) => {
        const percentage = data[0].count > 0 
          ? ((step.count / data[0].count) * 100).toFixed(1)
          : '0.0'
        
        const width = maxCount > 0 
          ? (step.count / maxCount) * 100
          : 0

        const dropOff = index > 0 
          ? data[index - 1].count - step.count
          : 0

        return (
          <div key={step.name} className="relative">
            {/* Barra do funil */}
            <div className="bg-gray-200 rounded-lg h-12 relative overflow-hidden">
              <div 
                className={`h-full rounded-lg transition-all duration-500 ${
                  index === 0 ? 'bg-blue-500' :
                  index === 1 ? 'bg-green-500' :
                  index === 2 ? 'bg-yellow-500' :
                  index === 3 ? 'bg-orange-500' :
                  index === 4 ? 'bg-red-500' :
                  'bg-purple-500'
                }`}
                style={{ width: `${width}%` }}
              />
              
              {/* Labels */}
              <div className="absolute inset-0 flex items-center justify-between px-4">
                <span className="text-white font-medium text-sm">
                  {step.name}
                </span>
                <div className="text-right text-white">
                  <div className="font-bold">{step.count.toLocaleString()}</div>
                  <div className="text-xs opacity-90">{percentage}%</div>
                </div>
              </div>
            </div>

            {/* Drop-off indicator */}
            {dropOff > 0 && (
              <div className="text-xs text-red-600 mt-1 ml-2">
                ↓ {dropOff.toLocaleString()} usuários perdidos ({((dropOff / data[index - 1].count) * 100).toFixed(1)}%)
              </div>
            )}
          </div>
        )
      })}

      {/* Resumo */}
      <div className="mt-6 grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {data[0]?.count?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-gray-600">Visitantes</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {data[data.length - 1]?.count?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-gray-600">Conversões</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {data[0]?.count > 0 
              ? ((data[data.length - 1]?.count / data[0].count) * 100).toFixed(2)
              : '0.00'
            }%
          </div>
          <div className="text-sm text-gray-600">Taxa de Conversão</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {data.length > 2 && data[2]?.count > 0
              ? ((data[data.length - 1]?.count / data[2].count) * 100).toFixed(1)
              : '0.0'
            }%
          </div>
          <div className="text-sm text-gray-600">Carrinho → Compra</div>
        </div>
      </div>
    </div>
  )
}