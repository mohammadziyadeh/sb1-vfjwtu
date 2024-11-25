import React from 'react';
import { MessageSquare, Twitter, Newspaper } from 'lucide-react';

const sentiments = [
  {
    source: 'Social Media',
    sentiment: 'Positive',
    score: 78,
    icon: Twitter,
  },
  {
    source: 'News',
    sentiment: 'Neutral',
    score: 52,
    icon: Newspaper,
  },
  {
    source: 'Community',
    sentiment: 'Positive',
    score: 82,
    icon: MessageSquare,
  },
];

export default function SentimentAnalysis() {
  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Market Sentiment</h2>
      <div className="space-y-4">
        {sentiments.map((item) => (
          <div
            key={item.source}
            className="flex items-center space-x-4 p-3 bg-gray-700 rounded-lg"
          >
            <div className="p-2 bg-gray-600 rounded-lg">
              <item.icon className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400">{item.source}</p>
              <p className="font-medium">{item.sentiment}</p>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-gray-600"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={175.93}
                  strokeDashoffset={175.93 * (1 - item.score / 100)}
                  className="text-blue-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium">{item.score}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}