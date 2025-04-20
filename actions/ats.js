"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function getATSScore(content) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    As an expert in resume evaluation and ATS systems, analyze the following resume content for a ${user.industry} professional.

    Provide an estimated ATS (Applicant Tracking System) compatibility score out of 100.

    Resume content:
    """
    ${content}
    """

    Only output the score as a number (e.g., "85"). Do not include any explanation or extra text.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const scoreText = response.text().trim();

    const score = parseInt(scoreText.match(/\d+/)?.[0], 10);

    if (isNaN(score)) {
      throw new Error("Could not parse ATS score from response");
    }

    return score;
  } catch (error) {
    console.error("Error getting ATS score:", error);
    throw new Error("Failed to evaluate ATS score");
  }
}
