import CoreGraphics
import Foundation
// Only exercise native input when the disposable project runner already permits it.
guard CGPreflightPostEventAccess() else {
    print("Existing macOS input permission unavailable")
    exit(2)
}
let source = CGEventSource(stateID: .combinedSessionState)
CGEvent(keyboardEventSource: source, virtualKey: 36, keyDown: true)?.post(tap:.cghidEventTap)
Thread.sleep(forTimeInterval: 0.1)
CGEvent(keyboardEventSource: source, virtualKey: 36, keyDown: false)?.post(tap:.cghidEventTap)
print("macOS Return key sent")
