import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { FAQItem } from '../types'

interface FAQAccordionProps {
  item: FAQItem
}

const FAQAccordion = ({ item }: FAQAccordionProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
            {item.category}
          </span>
          <span className="font-medium text-secondary">{item.question}</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="px-6 pb-4 pt-0 text-gray-600 leading-relaxed border-t border-border">
          <div className="pt-4">
            {item.answer}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FAQAccordion
