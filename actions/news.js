"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getLatestIndustryNews() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { industry: true },
  });

  if (!user || !user.industry) throw new Error("User or industry not found");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are a helpful assistant that provides current industry news in JSON format.
    Provide me with 5-10 recent news items about the ${user.industry} industry in the last 10 days.

    Return ONLY a valid JSON array with the following structure for each news item:
    [
      {
        "title": "News title (string)",
        "description": "Brief summary (string)",
        "url": "Source URL (string)",
        "source": "News source name (string)",
        "publishedAt": "Publication date in ISO format (string)"
      }
    ]

    Important:
    - Only return the JSON array, no additional text or markdown
    - Ensure all property names are double-quoted
    - Include at least 5 items
    - Make sure the JSON is valid and parsable
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean and parse the response
    let cleanedResponse = text.trim();

    // Remove any markdown code blocks if present more robustly
    const jsonStart = cleanedResponse.indexOf('[');
    const jsonEnd = cleanedResponse.lastIndexOf(']');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
      cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1).trim();
    }

    try {
      const news = JSON.parse(cleanedResponse);

      // Validate the response structure more thoroughly
      if (!Array.isArray(news)) {
        console.error("Error: Expected an array of news items, but received:", news);
        return []; // Or throw an error, depending on desired error handling
      }

      for (const item of news) {
        if (
          typeof item.title !== 'string' ||
          typeof item.description !== 'string' ||
          typeof item.url !== 'string' ||
          typeof item.source !== 'string' ||
          typeof item.publishedAt !== 'string'
        ) {
          console.error("Error: One or more news item has an invalid structure:", item);
          return []; // Or throw an error
        }
        // Attempt to parse the date to ensure it's a valid ISO format (basic check)
        if (isNaN(new Date(item.publishedAt).getTime())) {
          console.warn("Warning: Invalid date format found:", item.publishedAt);
          item.publishedAt = new Date().toISOString(); // Fallback to current date
        }
      }

      return news;

    } catch (jsonError) {
      console.error("Error parsing JSON response:", jsonError, "Raw response:", cleanedResponse);
      return []; // Or throw an error
    }

  } catch (error) {
    console.error("Error in getLatestIndustryNews:", {
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to fetch industry news: ${error.message}`);
  }
}