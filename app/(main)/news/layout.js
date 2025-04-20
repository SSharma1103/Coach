"use client";

import { useEffect, useState, useCallback } from 'react';
import { getLatestIndustryNews } from '@/actions/news';
import { useUser } from '@clerk/nextjs';

export default function IndustryNewsFeed() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useUser();

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLatestIndustryNews();
      setNews(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies, as it should only be created once

  useEffect(() => {
    fetchNews();
  }, [fetchNews, user?.id]); // fetchNews is now a dependency

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDomainFromUrl = (url) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.split('.')[0]; // Returns 'nytimes' from 'nytimes.com'
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-600">Fetching latest industry news...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-red-50 rounded-lg">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800">Couldn't load news</h3>
          </div>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setRetryCount(prev => prev + 1)}
            className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors self-start"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-yellow-50 rounded-lg text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-yellow-800 mb-1">No news found</h3>
        <p className="text-yellow-700">We couldn't find any recent news for your industry.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Industry Updates</h1>
        <p className="text-gray-600">Latest news and trends in your field</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {news.map((article, index) => (
          <article
            key={index}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 border border-gray-100"
          >
            <div className="p-6 h-full flex flex-col">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  {article.url && (
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {getDomainFromUrl(article.url) || article.source}
                    </span>
                  )}
                  <time className="text-xs text-gray-500">
                    {formatDate(article.publishedAt)}
                  </time>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {article.url ? (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 hover:underline"
                    >
                      {article.title}
                    </a>
                  ) : (
                    article.title
                  )}
                </h2>

                <p className="text-gray-600 mb-4">{article.description}</p>
              </div>

              {article.url ? (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Read full story
                  <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              ) : (
                <span className="mt-auto text-sm text-gray-400">Source link unavailable</span>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={fetchNews}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Refresh News
        </button>
      </div>
    </div>
  );
}