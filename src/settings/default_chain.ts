import type { Chain } from "src/models/chain";
import { BackwardConnection } from "src/connections/connections";
import { FactoryRuleNSteps, FactoryRuleToTheEnd } from "src/models/rule";
import { YamlTagConnection } from "src/connections/factories/yaml_tag";

export function getDefaultChain(): Chain {

	const hierarhyYamlConnection = new BackwardConnection(
		new YamlTagConnection("default hierarchy", ["topic", "entity"])
	)
	const nextYamlConnection = new YamlTagConnection("default next", ["next"])
	const prevYamlConnection = new BackwardConnection(
		new YamlTagConnection("default prev", ["prev"])
	)
	const basedYamlConnection = new YamlTagConnection("default base", ["base"])
	const toTheEnd = new FactoryRuleToTheEnd()
	const nSteps = new FactoryRuleNSteps(3)

	return {
		chainSteps: [
			{
				rule: toTheEnd,
				connections: [hierarhyYamlConnection]
			},
			{
				rule: nSteps,
				connections: [nextYamlConnection, prevYamlConnection, basedYamlConnection]
			}
		]
	}
}
