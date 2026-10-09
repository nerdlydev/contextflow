export {
  CrmContextProvider,
  crmContextProvider,
} from "./crm-context-provider.js";
export { formatContextForPrompt } from "./formatter.js";
export { ContextService, contextService } from "./service.js";
export {
  AgentContextNotSupportedError,
  type ContextProvider,
  type ResolvedApplicationContext,
  type ResolvedCustomerContext,
  ResourceNotFoundError,
  type ResourceReference,
  type TrustedExecutionContext,
  UnsupportedResourceTypeError,
} from "./types.js";
