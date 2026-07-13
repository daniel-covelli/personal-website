'use client';

import { useState } from 'react';
import { ResumeContent } from '@/lib/types';
import ContentEditor from './ContentEditor';
import ChatConfigEditor from './ChatConfigEditor';
import SystemPromptEditor from './SystemPromptEditor';

interface AdminTabsProps {
  content: ResumeContent;
  chatModels: string[];
  systemPrompt: string;
  defaultSystemPrompt: string;
}

const TABS = [
  { id: 'resume', label: 'Resume' },
  { id: 'config', label: 'Config' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AdminTabs({
  content,
  chatModels,
  systemPrompt,
  defaultSystemPrompt,
}: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('resume');

  return (
    <div>
      <div
        role="tablist"
        aria-label="Admin sections"
        className="mb-6 flex gap-1 border-b border-gray-200"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px border-b-2 px-5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Both tabs stay mounted so unsaved edits survive tab switches; the
          inactive one is hidden rather than unmounted. */}
      <div className={activeTab === 'resume' ? '' : 'hidden'}>
        <ContentEditor initialContent={content} />
      </div>
      <div className={activeTab === 'config' ? '' : 'hidden'}>
        <ChatConfigEditor initialModels={chatModels} />
        <SystemPromptEditor
          initialPrompt={systemPrompt}
          defaultPrompt={defaultSystemPrompt}
        />
      </div>
    </div>
  );
}
