import { createWorkflow, createStep } from "../inngest";
import { z } from "zod";
import { RuntimeContext } from "@mastra/core/di";
import { githubTrendingTool } from "../tools/githubTrendingTool";
import { emailReportTool } from "../tools/emailReportTool";

const runtimeContext = new RuntimeContext();

// Define shared schemas
const repositorySchema = z.object({
  name: z.string(),
  fullName: z.string(),
  language: z.string().nullable(),
  description: z.string().nullable(),
  stars: z.number(),
  url: z.string()
});

const fetchRepositoriesStep = createStep({
  id: "fetch-repositories",
  description: "Fetch top 10 trending GitHub repositories",
  inputSchema: z.object({}),
  outputSchema: z.object({
    repositories: z.array(repositorySchema)
  }),
  execute: async ({ mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('📝 [FetchRepositoriesStep] Starting to fetch trending repositories...');
    
    const result = await githubTrendingTool.execute({
      context: {},
      runtimeContext
    });
    
    logger?.info('✅ [FetchRepositoriesStep] Successfully fetched repositories', { 
      count: result.repositories.length 
    });
    
    return {
      repositories: result.repositories
    };
  }
});

const sendEmailReportStep = createStep({
  id: "send-email-report",
  description: "Send formatted email report with GitHub trending repositories",
  inputSchema: z.object({
    repositories: z.array(repositorySchema)
  }),
  outputSchema: z.object({
    success: z.boolean(),
    messageId: z.string(),
    accepted: z.array(z.string())
  }),
  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('📝 [SendEmailReportStep] Starting to send email report...');
    
    const recipientEmail = "abdulparawala.ap@gmail.com";
    
    const result = await emailReportTool.execute({
      context: {
        recipientEmail,
        repositories: inputData.repositories
      },
      runtimeContext
    });
    
    logger?.info('✅ [SendEmailReportStep] Email report sent successfully', { 
      messageId: result.messageId,
      accepted: result.accepted
    });
    
    return result;
  }
});

export const dailyGithubReportWorkflow = createWorkflow({
  id: "daily-github-report",
  description: "Daily automation that fetches trending GitHub repositories and emails a summary report",
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z.boolean(),
    messageId: z.string(),
    accepted: z.array(z.string())
  })
})
  .then(fetchRepositoriesStep)
  .then(sendEmailReportStep)
  .commit();