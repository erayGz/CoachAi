# Demo Checklist

## Setup

- Run `npm install`
- Run `npm run dev`
- Open `http://127.0.0.1:5173/`

## Viewport Tests

Use browser device tools or responsive mode to check:

- `360x740`
- `390x844`
- `740x360`
- `844x390`
- `720x1280`
- `1280x720`

Confirm for each viewport:

- App fills the viewport
- No phone mockup or desktop preview frame appears
- No horizontal scrolling
- Browser page does not scroll
- Screen content scrolls inside the app when needed
- Bottom navigation remains visible and does not cover content

## Functional Tests

- Clear local history
- Upload invalid video under 10 seconds
- Upload invalid video over 25 seconds
- Upload valid 10-25 second video
- Confirm Processing screen appears
- Confirm result changes dynamically across repeated analyses
- Confirm result is saved to History
- Confirm Dashboard stats update
- Confirm Profile stats update
- Confirm History filters work
- Confirm Profile actions show “Coming soon in a future version.”

## Suggested Manual Flow

1. Start at Splash.
2. Tap `Get Started`.
3. From Dashboard, open `Analyze Shooting`.
4. Read the Shooting Guide.
5. Continue to Video Upload.
6. Try one invalid short video and confirm the validation message.
7. Try one invalid long video and confirm the validation message.
8. Upload a valid 10-25 second video.
9. Tap `Analyze Video`.
10. Wait for Processing to finish.
11. Review Results.
12. Open History and verify the saved analysis appears at the top.
13. Return to Dashboard and verify stats/recent sessions updated.
14. Open Profile and verify stats updated.
15. Tap Profile actions and verify the coming-soon feedback appears.
