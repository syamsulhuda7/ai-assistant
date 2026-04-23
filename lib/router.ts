import { classifyIntent } from "./intentClassifier";
import { DATA_SOURCE_RULES } from "./config/dataSources";

export async function routeMessage(message: string) {
  const intent = classifyIntent(message);
  const rule = DATA_SOURCE_RULES[intent];

  return {
    intent,
    source: rule.source,
    useCache: rule.cache,
  };
}
