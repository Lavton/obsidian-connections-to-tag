const TEST_OPERATION_DELAY_MS = 2000

export async function waitForTestOperationDelay(): Promise<void> {
	if (TEST_OPERATION_DELAY_MS <= 0) {
		return
	}
	await new Promise<void>((resolve) => window.setTimeout(resolve, TEST_OPERATION_DELAY_MS))
}
