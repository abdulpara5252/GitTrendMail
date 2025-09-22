import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";
import { getUncachableGitHubClient } from "../../utils/github";

export const githubTrendingTool = createTool({
  id: "fetch-github-trending",
  description: "Fetches the top 10 trending GitHub repositories with their names and programming languages",
  inputSchema: z.object({}),
  outputSchema: z.object({
    repositories: z.array(z.object({
      name: z.string(),
      fullName: z.string(),
      language: z.string().nullable(),
      description: z.string().nullable(),
      stars: z.number(),
      url: z.string()
    }))
  }),
  execute: async ({ mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🔧 [GitHubTrendingTool] Starting execution to fetch trending repositories');
    
    try {
      logger?.info('📝 [GitHubTrendingTool] Getting GitHub client...');
      const github = await getUncachableGitHubClient();
      
      logger?.info('📝 [GitHubTrendingTool] Searching for trending repositories...');
      
      // Search for trending repositories by searching for repositories created in the last week
      // and sorting by stars to get the most popular/trending ones
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const dateString = oneWeekAgo.toISOString().split('T')[0];
      
      const response = await github.rest.search.repos({
        q: `created:>${dateString}`,
        sort: 'stars',
        order: 'desc',
        per_page: 10
      });
      
      logger?.info('📝 [GitHubTrendingTool] Processing repository data...', { 
        count: response.data.items.length 
      });
      
      const repositories = response.data.items.map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        language: repo.language,
        description: repo.description,
        stars: repo.stargazers_count,
        url: repo.html_url
      }));
      
      logger?.info('✅ [GitHubTrendingTool] Successfully fetched trending repositories', { 
        repositoryCount: repositories.length 
      });
      
      return { repositories };
      
    } catch (error) {
      logger?.error('❌ [GitHubTrendingTool] Error fetching trending repositories', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  },
});