import type { Chain } from "src/models/chain";
import { YamlConnectionTag } from "src/models/connections";
import { FactoryRuleNSteps, FactoryRuleToTheEnd } from "src/models/rule";

export function getDefaultChain(): Chain {

	const hierarhyYamlConnection = new YamlConnectionTag(
		[], ["topic", "entity"]
	)
	const nextPrevYamlConnection = new YamlConnectionTag(
		["next"], ["prev"]
	)
	const basedYamlConnection = new YamlConnectionTag(
		["base"], []
	)
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
				connections: [nextPrevYamlConnection, basedYamlConnection]
			}
		]
	}
}
