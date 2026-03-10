import { useState, useEffect, useRef } from 'react'
import { addonSections } from '../../data/addons'
import { useToast } from '../../contexts/ToastContext'

export default function ProductAddons({ addonKeys, onAddonsChange, onCompletionChange }) {
  const { showToast } = useToast()
  const initializedRef = useRef(false)

  const [selections, setSelections] = useState(() => {
    const initial = {}
    addonKeys.forEach(key => {
      const section = addonSections[key]
      if (section) {
        if (section.max > 1 && section.items.length === 1) {
          initial[key] = { [section.items[0].id]: section.max }
        } else if (section.max > 1) {
          initial[key] = {}
        } else {
          initial[key] = null
        }
      }
    })
    return initial
  })

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      notifyParent(selections)
    }
  }, [])

  function notifyParent(newSelections) {
    if (onAddonsChange) {
      const selectedList = []
      let extraCost = 0

      Object.entries(newSelections).forEach(([key, value]) => {
        const sec = addonSections[key]
        if (!sec) return

        if (sec.max === 1) {
          if (sec.qtyOnSelect && value && value.id) {
            const found = sec.items.find(i => i.id === value.id)
            if (found) {
              const qty = value.qty || 1
              selectedList.push({ name: found.name, qty })
              // Se tem promo, 1ª unidade é grátis; extras cobram preço cheio
              // Se não tem promo, todas as unidades cobram
              if (found.promo) {
                extraCost += found.price * Math.max(0, qty - 1)
              } else {
                extraCost += found.price * qty
              }
            }
          } else if (value && typeof value === 'string') {
            const found = sec.items.find(i => i.id === value)
            if (found) {
              selectedList.push({ name: found.name, qty: 1 })
              // Se não tem promo, cobra o preço
              if (!found.promo) {
                extraCost += found.price
              }
            }
          }
        } else {
          // Multi-select: calcula custo com freeQty
          let freeRemaining = sec.freeQty || 0

          Object.entries(value || {}).forEach(([itemId, qty]) => {
            if (qty > 0) {
              const found = sec.items.find(i => i.id === itemId)
              if (found) {
                selectedList.push({ name: found.name, qty })

                if (sec.freeQty > 0) {
                  // Seção com freeQty: itens com promo usam as unidades grátis
                  if (found.promo && freeRemaining > 0) {
                    const freeUnits = Math.min(qty, freeRemaining)
                    const paidUnits = qty - freeUnits
                    freeRemaining -= freeUnits
                    extraCost += found.price * paidUnits
                  } else {
                    // Sem promo ou sem free restante: cobra tudo
                    extraCost += found.price * qty
                  }
                } else {
                  // Seção sem freeQty: itens com promo são grátis, sem promo cobra
                  if (!found.promo) {
                    extraCost += found.price * qty
                  }
                }
              }
            }
          })
        }
      })
      onAddonsChange(selectedList, extraCost)
    }

    if (onCompletionChange) {
      const requiredSections = addonKeys.filter(k => {
        const s = addonSections[k]
        return s && !s.optional
      })
      let filledSections = 0
      requiredSections.forEach(key => {
        const value = newSelections[key]
        const sec = addonSections[key]
        if (!sec) return
        if (sec.max === 1) {
          if (sec.qtyOnSelect && value && value.id) filledSections++
          else if (value && typeof value === 'string') filledSections++
        }
        if (sec.max > 1) {
          const total = Object.values(value || {}).reduce((s, v) => s + v, 0)
          if (total > 0) filledSections++
        }
      })
      onCompletionChange(filledSections >= requiredSections.length)
    }
  }

  const handleRadioSelect = (sectionKey, itemId) => {
    setSelections(prev => {
      const isDeselecting = prev[sectionKey] === itemId
      const newSelections = { ...prev, [sectionKey]: isDeselecting ? null : itemId }
      notifyParent(newSelections)
      return newSelections
    })
  }

  const handleRadioQtySelect = (sectionKey, itemId) => {
    setSelections(prev => {
      const current = prev[sectionKey]
      const isDeselecting = current && current.id === itemId
      const newValue = isDeselecting ? null : { id: itemId, qty: 1 }
      const newSelections = { ...prev, [sectionKey]: newValue }
      notifyParent(newSelections)
      return newSelections
    })
  }

  const handleRadioQtyChange = (sectionKey, delta) => {
    setSelections(prev => {
      const current = prev[sectionKey]
      if (!current || !current.id) return prev

      const newQty = (current.qty || 1) + delta
      if (newQty < 1) return prev
      if (newQty > 10) {
        showToast('Limite máximo de 10 unidades!')
        return prev
      }

      const newSelections = { ...prev, [sectionKey]: { ...current, qty: newQty } }
      notifyParent(newSelections)
      return newSelections
    })
  }

  const handleQtyChange = (sectionKey, itemId, delta) => {
    const section = addonSections[sectionKey]
    if (!section) return

    setSelections(prev => {
      const sectionData = { ...(prev[sectionKey] || {}) }
      const currentQty = sectionData[itemId] || 0
      const newQty = currentQty + delta

      if (newQty < 0) return prev

      const totalInSection = Object.values(sectionData).reduce((s, v) => s + v, 0)
      if (delta > 0 && totalInSection >= section.max) {
        showToast(`Limite de ${section.max} opções nesta seção!`)
        return prev
      }

      if (newQty === 0) {
        delete sectionData[itemId]
      } else {
        sectionData[itemId] = newQty
      }

      const newSelections = { ...prev, [sectionKey]: sectionData }
      notifyParent(newSelections)
      return newSelections
    })
  }

  return (
    <div className="pd-addons">
      {addonKeys.map(key => {
        const section = addonSections[key]
        if (!section) return null

        const isMulti = section.max > 1
        const isSingleOption = isMulti && section.items.length === 1
        const hasQtyOnSelect = !isMulti && section.qtyOnSelect
        const qtyData = isMulti ? (selections[key] || {}) : {}
        const totalSelected = isMulti ? Object.values(qtyData).reduce((s, v) => s + v, 0) : 0

        const radioQtySelection = hasQtyOnSelect ? selections[key] : null
        const selectedId = !isMulti
          ? (hasQtyOnSelect ? (radioQtySelection ? radioQtySelection.id : null) : selections[key])
          : null

        return (
          <section className="pd-addon-section" key={key}>
            <div className="pd-addon-header">
              <div className="pd-addon-header-left">
                <h3 className="pd-addon-title">{section.title}</h3>
                <span className="pd-addon-subtitle">{section.subtitle}</span>
              </div>
              {isMulti && !isSingleOption ? (
                <span className="pd-addon-counter">{totalSelected}/{section.max}</span>
              ) : section.optional ? (
                <span className="pd-addon-badge optional">OPCIONAL</span>
              ) : (
                <span className="pd-addon-badge">OBRIGATÓRIO</span>
              )}
            </div>

            <div className="pd-addon-list">
              {section.items.map(item => {
                const hasImage = !!item.image

                /* Item único auto-selecionado */
                if (isSingleOption) {
                  return (
                    <div className={`pd-addon-item selected ${hasImage ? 'has-image' : ''}`} key={item.id}>
                      <div className="pd-addon-item-info">
                        <span className="pd-addon-item-name">{item.name}</span>
                        {item.description && <span className="pd-addon-item-desc">{item.description}</span>}
                      </div>
                      {hasImage && (
                        <div className="pd-addon-item-img">
                          <img src={item.image} alt={item.name} />
                        </div>
                      )}
                      <div className="pd-addon-radio active">
                        <div className="pd-addon-radio-dot"></div>
                      </div>
                    </div>
                  )
                }

                /* Multi-select com quantidade */
                if (isMulti) {
                  const qty = qtyData[item.id] || 0
                  return (
                    <div className={`pd-addon-item ${qty > 0 ? 'selected' : ''} ${hasImage ? 'has-image' : ''}`} key={item.id}>
                      <div className="pd-addon-item-info">
                        <span className="pd-addon-item-name">{item.name}</span>
                        {item.description && <span className="pd-addon-item-desc">{item.description}</span>}
                        {item.price > 0 && (
                          <span className={`pd-addon-item-price ${item.promo ? 'has-promo' : ''}`}>
                            R$ {item.price.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                        {item.promo && <span className="pd-addon-item-promo">{item.promo}</span>}
                      </div>

                      {hasImage && (
                        <div className="pd-addon-item-img">
                          <img src={item.image} alt={item.name} />
                        </div>
                      )}

                      {qty === 0 ? (
                        <button className="pd-addon-add-btn" onClick={() => handleQtyChange(key, item.id, 1)} disabled={totalSelected >= section.max}>
                          <i className="fas fa-plus"></i>
                        </button>
                      ) : (
                        <div className="pd-addon-qty-badge">
                          <button className="pd-addon-qb-btn" onClick={() => handleQtyChange(key, item.id, -1)}>
                            <i className="fas fa-minus"></i>
                          </button>
                          <span className="pd-addon-qb-value">{qty}</span>
                          <button className="pd-addon-qb-btn plus" onClick={() => handleQtyChange(key, item.id, 1)} disabled={totalSelected >= section.max}>
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                }

                /* Radio (max=1) com ou sem qtyOnSelect */
                const isSelected = selectedId === item.id
                const itemQty = isSelected && hasQtyOnSelect ? (radioQtySelection?.qty || 1) : 0

                return (
                  <div
                    className={`pd-addon-item ${isSelected ? 'selected' : ''} ${hasImage ? 'has-image' : ''}`}
                    key={item.id}
                    onClick={!hasQtyOnSelect ? () => handleRadioSelect(key, item.id) : undefined}
                  >
                    <div className="pd-addon-item-info">
                      <span className="pd-addon-item-name">{item.name}</span>
                      {item.description && <span className="pd-addon-item-desc">{item.description}</span>}
                      {item.price > 0 && (
                        <span className={`pd-addon-item-price ${item.promo ? 'has-promo' : ''}`}>
                          R$ {item.price.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      {item.promo && <span className="pd-addon-item-promo">{item.promo}</span>}
                    </div>

                    {hasImage && (
                      <div className="pd-addon-item-img">
                        <img src={item.image} alt={item.name} />
                      </div>
                    )}

                    {hasQtyOnSelect ? (
                      !isSelected ? (
                        <button className="pd-addon-add-btn" onClick={(e) => { e.stopPropagation(); handleRadioQtySelect(key, item.id) }}>
                          <i className="fas fa-plus"></i>
                        </button>
                      ) : (
                        <div className="pd-addon-qty-badge" onClick={e => e.stopPropagation()}>
                          <button className="pd-addon-qb-btn" onClick={() => {
                            if (itemQty <= 1) handleRadioQtySelect(key, item.id)
                            else handleRadioQtyChange(key, -1)
                          }}>
                            <i className="fas fa-minus"></i>
                          </button>
                          <span className="pd-addon-qb-value">{itemQty}</span>
                          <button className="pd-addon-qb-btn plus" onClick={() => handleRadioQtyChange(key, 1)}>
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                      )
                    ) : (
                      <div className={`pd-addon-radio ${isSelected ? 'active' : ''}`}>
                        {isSelected && <div className="pd-addon-radio-dot"></div>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
