import AppKit
import CoreGraphics
import Foundation
guard CGPreflightPostEventAccess() else { print("No existing keyboard permission");exit(2) }
let source=CGEventSource(stateID:.combinedSessionState)
func key(_ code:CGKeyCode,_ flags:CGEventFlags=[]) {
    let down=CGEvent(keyboardEventSource:source,virtualKey:code,keyDown:true)
    let up=CGEvent(keyboardEventSource:source,virtualKey:code,keyDown:false)
    down?.flags=flags;up?.flags=flags
    down?.post(tap:.cghidEventTap);Thread.sleep(forTimeInterval:0.12);up?.post(tap:.cghidEventTap)
}
let vo:CGEventFlags=[.maskControl,.maskAlternate]
switch CommandLine.arguments.last {
case "start": key(96,[.maskCommand])
case "welcome": key(36)
case "copy": key(8,[.maskControl,.maskAlternate,.maskShift])
case "describe": key(99,vo)
case "state":
    print("voiceOverEnabled=\(NSWorkspace.shared.isVoiceOverEnabled)")
default:exit(3)
}
