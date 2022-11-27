import { animate, group, query, style, transition, trigger } from "@angular/animations";

export const showUp = [
    trigger("showUp", [
        transition(":enter", [
            group([
                style({ backgroundColor: "rgba(0,0,0,0)" }),
                animate("150ms ease-in", style({ backgroundColor: "rgba(0,0,0,0.25)" })),
                query(".box", [
                    style({ opacity: "0", scale: "0.7" }),
                    animate("150ms ease-in", style({ opacity: "1", scale: "1" })),
                ])
            ])
        ]),
        transition(":leave", [
            group([
                animate("150ms ease-in", style({ backgroundColor: "rgba(0,0,0,0)" })),
                query(".box", [
                    style({ opacity: "1", scale: "1" }),
                    animate("150ms ease-in", style({ opacity: "0", scale: "0.7" })),
                ])
            ])
        ]),
    ])
]