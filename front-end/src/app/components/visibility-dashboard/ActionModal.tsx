import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  suggestedText?: string;
  suggestedHashtags?: string[];
}

export function ActionModal({ isOpen, onClose, title, content, suggestedText, suggestedHashtags }: ActionModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-bs-neutral-200 p-6 flex items-center justify-between">
          <h2 className="font-bold text-bs-neutral-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bs-neutral-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-bs-neutral-700">{content}</p>

          {suggestedText && (
            <div className="bg-bs-neutral-50 border border-bs-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-bs-neutral-900">AI-Suggested Text</h3>
                <button
                  onClick={() => handleCopy(suggestedText)}
                  className="flex items-center gap-2 text-sm text-bs-blue hover:underline"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-sm text-bs-neutral-700 italic">"{suggestedText}"</p>
            </div>
          )}

          {suggestedHashtags && suggestedHashtags.length > 0 && (
            <div className="bg-bs-neutral-50 border border-bs-neutral-200 rounded-lg p-4">
              <h3 className="font-bold text-sm text-bs-neutral-900 mb-2">Suggested Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {suggestedHashtags.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => handleCopy(tag)}
                    className="px-3 py-1 bg-bs-gold/20 text-bs-neutral-900 rounded-full text-sm hover:bg-bs-gold/30 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-bs-gold text-bs-neutral-900 rounded-lg hover:bg-[#FFE44D] transition-colors font-medium"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
