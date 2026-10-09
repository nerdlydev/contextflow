import { crmContextProvider } from "./crm-context-provider.js";
import { formatContextForPrompt } from "./formatter.js";
import {
  type ContextProvider,
  type ResolvedApplicationContext,
  type ResourceReference,
  type TrustedExecutionContext,
  UnsupportedResourceTypeError,
} from "./types.js";

/**
 * Service orchestrating application context resolution and assembly.
 *
 * Dispatches resource references to registered ContextProviders,
 * ensuring trusted, minimal context is assembled before agent execution.
 */
export class ContextService {
  private readonly providers = new Map<string, ContextProvider>();

  constructor(initialProviders: ContextProvider[] = [crmContextProvider]) {
    for (const provider of initialProviders) {
      this.register(provider);
    }
  }

  /**
   * Registers a ContextProvider for a specific resource type.
   */
  register(provider: ContextProvider): void {
    this.providers.set(provider.resourceType, provider);
  }

  /**
   * Resolves application context for a given resource reference.
   * Throws UnsupportedResourceTypeError if no provider is registered for the resource type.
   * Throws ResourceNotFoundError if the entity does not exist.
   */
  async resolveContext(
    reference: ResourceReference,
    context?: TrustedExecutionContext,
  ): Promise<ResolvedApplicationContext> {
    const provider = this.providers.get(reference.type);
    if (!provider) {
      throw new UnsupportedResourceTypeError(reference.type);
    }

    return (await provider.resolve(reference, context)) as ResolvedApplicationContext;
  }

  /**
   * Formats resolved context into safe prompt text for the model.
   */
  formatContext(context: ResolvedApplicationContext): string {
    return formatContextForPrompt(context);
  }
}

/**
 * Default singleton instance of ContextService.
 */
export const contextService = new ContextService();
