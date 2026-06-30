# Toro Internal Course Mapping & Imagery Publisher
## Full Execution Plan for Qwen 3.6

---

## 1. Product Definition

Build a Toro-branded internal desktop application that guides one internal user through a highly controlled, step-by-step wizard for preparing, aligning, validating, and publishing updated course imagery into the correct Mapbox-based course map.

This is not a generic GIS tool.

This is not a complex QGIS replacement.

This is a focused, guided, internal mapping workflow that makes a complicated geospatial task feel simple, safe, and almost impossible to mess up.

The application should feel like:

```text
Toro internal software
+ Airbnb-level simplicity
+ QGIS-lite mapping controls
+ step-by-step wizard guidance
+ Mapbox sandbox preview
+ safe publish workflow
```

The user should be able to open the app and immediately understand what to do next.

---

## 2. Core Product Goal

The goal is to allow an internal Toro user to:

1. Select the course/map they want to update.
2. Open a sandbox Mapbox workspace inside the app.
3. Upload new aerial/course imagery.
4. Align that imagery using simple QGIS-like controls.
5. Validate the alignment against the existing Mapbox/course layers.
6. Preview the final map before publishing.
7. Publish the approved imagery to the correct Mapbox/API target.
8. Receive a clear confirmation that the update was successful.

The user should not need to manually leave the app for QGIS, Mapbox Studio, or any other mapping tool during the main workflow.

---

## 3. Recommended Application Type

Use a **desktop app built with Electron**.

This is the best choice for this specific use case because:

- It is intended for a small internal user group.
- It may be given to one trained person.
- It can run locally.
- It can handle local image files easily.
- It can include Mapbox directly inside the app.
- It can feel like a focused internal utility instead of a web portal.
- It can support local draft saving, project files, exports, and future offline-ish workflows.
- It avoids needing a fully hosted platform immediately.

The app can still talk to Mapbox APIs and internal APIs when needed, but the primary experience should be a local desktop wizard.

---

## 4. Final Product Framing

Use this product name internally for now:

```text
Toro Course Imagery Publisher
```

Alternative names:

```text
Toro Map Imagery Wizard
Toro Course Mapping Wizard
Toro Imagery Alignment Tool
Toro Course Map Publisher
```

The best name for clarity is:

```text
Toro Course Imagery Publisher
```

because it communicates the full workflow:

```text
select course → prepare imagery → align imagery → validate → publish
```

---

## 5. Design Direction

The app should feel:

- Clean
- Spacious
- Simple
- Controlled
- Professional
- Toro-branded
- Wizard-driven
- Low cognitive load
- Safe for non-GIS experts
- Powerful only when needed

The design should not feel like a developer tool.

The design should not feel like QGIS.

The design should not expose technical complexity too early.

The design should feel like:

```text
“This app knows exactly what I need to do next.”
```

---

## 6. Visual Style

### Brand Feel

Use a Toro-inspired internal software style:

- Toro red as the primary action color
- Dark charcoal / black for headers and strong UI accents
- Light grays for panels, dividers, and surfaces
- White space-heavy layout
- Soft cards
- Clear step indicators
- Minimal clutter
- High contrast for important actions
- Calm, guided copy

### Suggested Color Tokens

```ts
const colors = {
  toroRed: "#D71920",
  toroRedDark: "#A80F16",
  charcoal: "#1F2328",
  black: "#111111",
  gray900: "#202124",
  gray700: "#4B5563",
  gray500: "#6B7280",
  gray300: "#D1D5DB",
  gray200: "#E5E7EB",
  gray100: "#F3F4F6",
  gray50: "#F9FAFB",
  white: "#FFFFFF",
  success: "#15803D",
  warning: "#B45309",
  error: "#B91C1C",
  mapBlue: "#2563EB"
};
```

### UI Personality

Use Airbnb-like simplicity:

- Big clear headings
- Short instructional text
- One primary action per step
- Obvious progress indicator
- Calm empty states
- Clear success screen
- No technical jargon unless the user opens advanced settings

---

## 7. High-Level Architecture

```text
Electron Desktop App
│
├── Wizard Shell
│   ├── Step navigation
│   ├── Progress indicator
│   ├── Validation gates
│   └── Final confirmation
│
├── Mapbox Sandbox Workspace
│   ├── Embedded Mapbox GL JS map
│   ├── Existing course map preview
│   ├── Uploaded imagery overlay
│   ├── Layer ordering preview
│   └── Before/after comparison
│
├── Image Georeferencing Engine
│   ├── Four-corner placement
│   ├── Control point alignment
│   ├── Move / scale / rotate
│   ├── Opacity
│   ├── Nudge controls
│   └── Coordinate output
│
├── Local Project System
│   ├── Save draft
│   ├── Load draft
│   ├── Version history
│   ├── Image file references
│   └── Export package
│
├── Validation System
│   ├── Required fields
│   ├── Alignment checklist
│   ├── Publish readiness
│   └── Error prevention
│
├── Publishing Adapter
│   ├── Mapbox API publishing
│   ├── Internal API publishing if needed
│   ├── Dry-run publish
│   └── Publish result confirmation
│
└── Audit + Logging
    ├── Local activity log
    ├── Publish log
    ├── Error log
    └── Export log
```

---

## 8. Important Architectural Principle

The app must separate three major concerns:

```text
1. Wizard UI
2. Mapping/georeferencing logic
3. Publishing logic
```

Do not mix these together.

Qwen must not place Mapbox code randomly inside all components.

Create clear service layers.

Recommended structure:

```text
/src
  /app
    App.tsx
    routes.tsx

  /wizard
    WizardShell.tsx
    WizardProgress.tsx
    WizardFooter.tsx
    wizardSteps.ts

  /features
    /course-selection
    /image-upload
    /map-sandbox
    /georeference
    /validation
    /preview
    /publish
    /success

  /mapbox
    MapboxCanvas.tsx
    mapboxConfig.ts
    mapboxLayerManager.ts
    mapboxOverlaySource.ts
    mapboxPublishAdapter.ts

  /georeferencing
    georeferenceTypes.ts
    coordinateUtils.ts
    transformUtils.ts
    controlPointEngine.ts
    overlayGeometry.ts

  /storage
    localProjectRepository.ts
    projectFileSystem.ts
    exportPackageBuilder.ts

  /state
    wizardStore.ts
    courseStore.ts
    overlayStore.ts
    publishStore.ts

  /ui
    Button.tsx
    Card.tsx
    StepHeader.tsx
    Panel.tsx
    StatusBadge.tsx
    EmptyState.tsx

  /types
    course.ts
    overlay.ts
    publish.ts
    project.ts
    audit.ts
```

---

## 9. Core Wizard Flow

The app should be built around a wizard. The user should always know:

- What step they are on
- What they need to do now
- What is required before moving forward
- What will happen if they continue
- Whether the work is saved
- Whether they are still in sandbox mode
- Whether they are about to publish to a real target

### Wizard Steps

```text
Step 1: Start / Select Course
Step 2: Confirm Target Map
Step 3: Upload Imagery
Step 4: Sandbox Alignment
Step 5: Accuracy Check
Step 6: Preview Final Map
Step 7: Publish
Step 8: Success / Next Actions
```

---

## 10. Step 1: Start / Select Course

### Purpose

The user selects which course or map they want to affect.

### UI

Show a clean welcome screen.

Example title:

```text
Update course imagery
```

Example body:

```text
Select the course you want to update. The app will create a sandbox workspace first, so nothing will be published until the final step.
```

### User Actions

User can:

- Search by course name
- Search by course ID
- Search by customer/account
- Manually enter coordinates if no course exists yet

### Required Inputs

- Course ID or manual location
- Course name
- Target environment: sandbox/staging/production

### Guardrails

Do not allow the user to continue unless a course/map target is selected.

### Acceptance Criteria

- User can select a course.
- App stores selected course in state.
- App clearly confirms the chosen target.
- User understands nothing is published yet.

---

## 11. Step 2: Confirm Target Map

### Purpose

Make sure the user is affecting the correct map before they do any work.

### UI

Show:

- Course name
- Course location
- Current Mapbox preview
- Existing satellite imagery
- Existing course layers if available
- Current course boundary if available

Example title:

```text
Confirm this is the right course
```

Example body:

```text
Review the map below before continuing. This is the course your imagery will be aligned to.
```

### User Actions

- Pan/zoom map
- Confirm target
- Go back and select another course

### Guardrails

Require the user to check:

```text
I confirm this is the correct course/map target.
```

### Acceptance Criteria

- Mapbox renders inside the app.
- User can confirm the target.
- App stores confirmation before continuing.

---

## 12. Step 3: Upload Imagery

### Purpose

The user uploads the new aerial/course image.

### Supported MVP Formats

- PNG
- JPG
- JPEG

### Future Formats

- GeoTIFF
- TIFF
- WebP
- Drone orthomosaic exports

### UI

Show a large drag-and-drop upload area.

Example title:

```text
Upload the new course image
```

Example body:

```text
Upload the image you want to place over the course map. For best results, use a high-resolution aerial image that covers the full area being updated.
```

### File Validation

Check:

- File type
- File size
- Image dimensions
- Corrupt image
- Duplicate file name
- Missing alpha channel if transparency is expected
- Very low resolution warning

### Recommended MVP Limits

```text
Max file size: 50 MB
Max image dimension: 10,000 px on longest side
Minimum recommended width: 2,000 px
```

### Acceptance Criteria

- User can upload image.
- User sees preview.
- User sees file metadata.
- User can replace image.
- Invalid files show helpful errors.

---

## 13. Step 4: Sandbox Alignment

### Purpose

This is the core of the application.

The user aligns the uploaded image over a Mapbox sandbox map before anything is published.

### UX Principle

This step should feel powerful but not overwhelming.

The user should see:

- Mapbox map
- Uploaded image overlay
- Opacity control
- Simple alignment tools
- Step-by-step hints
- Clear “Sandbox” label

### UI Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ Step 4 of 8: Align imagery                                  │
│ Sandbox mode · Nothing is published yet                     │
├───────────────┬──────────────────────────────┬──────────────┤
│ Tools Panel   │        Mapbox Workspace       │ Details      │
│               │                              │              │
│ Move          │  Existing map + overlay       │ Coordinates  │
│ Rotate        │                              │ Opacity      │
│ Scale         │                              │ Accuracy     │
│ Corners       │                              │ Hints        │
│ Opacity       │                              │              │
└───────────────┴──────────────────────────────┴──────────────┘
```

### Alignment Tools

MVP tools:

- Move full image
- Scale image
- Rotate image
- Adjust opacity
- Move four corners
- Reset placement
- Undo
- Redo
- Keyboard nudge

### Advanced Later Tools

- Add control points
- Match known points
- Distance measurement
- Snap to course boundary
- GeoTIFF auto-placement
- Raster tile preview

### Mapbox Rendering Method

Use Mapbox image source first.

```ts
map.addSource("sandbox-course-image", {
  type: "image",
  url: imageUrl,
  coordinates: [
    topLeft,
    topRight,
    bottomRight,
    bottomLeft
  ]
});
```

Then add a raster layer:

```ts
map.addLayer({
  id: "sandbox-course-image-layer",
  type: "raster",
  source: "sandbox-course-image",
  paint: {
    "raster-opacity": opacity
  }
});
```

### Important

Do not publish from this step.

This step only updates the sandbox preview.

### Acceptance Criteria

- User can visually align imagery.
- User can adjust opacity.
- User can move corners.
- User can reset.
- User can undo/redo.
- App continuously stores draft state.
- App clearly labels the workspace as sandbox.

---

## 14. Step 5: Accuracy Check

### Purpose

Before preview/publish, require the user to validate that the imagery is aligned well enough.

### UI

Show a checklist beside the map.

Example title:

```text
Check the alignment
```

Example body:

```text
Review the overlay against the existing course map. Confirm each item before continuing.
```

### Checklist

Require user to confirm:

- Cart paths align
- Greens align
- Tee boxes align
- Bunkers align
- Water features align
- Roads or surrounding landmarks align
- Image does not cover unrelated properties
- Overlay is assigned to the correct course
- Image source is approved for internal use

### Accuracy Status

Use labels:

```text
Rough placement
Visually aligned
Reviewed
Ready to publish
```

### Acceptance Criteria

- User must complete checklist.
- App stores checklist state.
- User cannot continue if required checks are missing.
- App shows any warnings clearly.

---

## 15. Step 6: Preview Final Map

### Purpose

Show the user exactly what will be published.

This is the final review screen before publishing.

### UI

Use a clean preview layout.

Show:

- Final map preview
- Before/after toggle
- Opacity comparison
- Layer order preview
- Course name
- Target environment
- Imagery filename
- Publish destination
- Metadata summary

### Recommended Preview Modes

- Before
- After
- Split view
- Blink comparison
- Opacity slider

### Example title

```text
Preview the final map
```

Example body:

```text
This is how the course imagery will appear after publishing. Review it carefully before continuing.
```

### Acceptance Criteria

- User can compare before and after.
- User can see final overlay.
- User can confirm final preview.
- User can go back to adjust alignment.

---

## 16. Step 7: Publish

### Purpose

This is the only step that can affect the real target.

### UI

Make this step feel serious but not scary.

Example title:

```text
Publish course imagery
```

Example body:

```text
You are about to publish this imagery to the selected course. The update will only apply to this course/map target.
```

### Required Confirmation

Before enabling publish, show:

- Course name
- Course ID
- Target environment
- Image filename
- Publish destination
- Last saved time
- Validation checklist status
- Preview confirmation status

Require checkbox:

```text
I understand this will publish imagery to the selected course.
```

### Publish Button

Primary button:

```text
Publish imagery
```

Use Toro red.

### Publish Process

The app should:

1. Save final project state.
2. Build publish payload.
3. Upload image if needed.
4. Send metadata and coordinates to publishing adapter.
5. Confirm Mapbox/API success.
6. Store publish result.
7. Move to success screen.

### Acceptance Criteria

- Publish is disabled until all requirements pass.
- User can see what will be published.
- Publish result is stored.
- App handles errors gracefully.

---

## 17. Step 8: Success / Next Actions

### Purpose

Clearly tell the user the process worked and what they can do next.

### UI

Use a calm success screen with a big confirmation.

Example title:

```text
Course imagery published successfully
```

Example body:

```text
The updated imagery has been published to the selected course. You can review the final map below or open the exported package.
```

### Show

- Success status
- Final map preview
- Course name
- Publish timestamp
- Published by
- Environment
- Link/button to open final map preview
- Button to export package
- Button to start another course

### Final Actions

Buttons:

```text
View published map
Export package
Open project folder
Start another update
Close
```

### Acceptance Criteria

- User sees confirmation.
- User sees final preview.
- User gets next actions.
- User can export the result.

---

## 18. Publishing Strategy

The app should support two levels of publishing.

### MVP Publishing

For MVP, publishing can generate a clean output package:

```text
/course-imagery-package
  overlay.png
  overlay-metadata.json
  mapbox-layer-snippet.ts
  preview.png
  publish-summary.md
```

This allows engineering or another system to consume the result.

### Production Publishing

For production, the app should call a Mapbox/API adapter.

Possible publish outputs:

- Upload to Mapbox Tilesets API
- Upload to internal storage and render as Mapbox image source
- Update an internal course imagery service
- Update a specific Mapbox style/layer
- Generate a publish package for manual review

### Best Recommendation

Do not tightly couple the app directly to Mapbox-only publishing.

Create a publishing adapter interface:

```ts
interface PublishingAdapter {
  validate(payload: PublishPayload): Promise<ValidationResult>;
  publish(payload: PublishPayload): Promise<PublishResult>;
  rollback?(publishId: string): Promise<RollbackResult>;
}
```

Then implement:

```text
LocalExportPublishingAdapter
MapboxPublishingAdapter
InternalApiPublishingAdapter
```

This keeps the product future-proof.

---

## 19. Recommended Data Models

### Course

```ts
type Course = {
  id: string;
  name: string;
  customerId?: string;
  location: {
    longitude: number;
    latitude: number;
  };
  boundaryGeoJson?: GeoJSON.FeatureCollection;
  mapboxStyleId?: string;
  mapboxDatasetId?: string;
  environment: "sandbox" | "staging" | "production";
};
```

### Imagery Project

```ts
type ImageryProject = {
  id: string;
  courseId: string;
  courseName: string;
  status:
    | "created"
    | "course_confirmed"
    | "image_uploaded"
    | "aligned"
    | "validated"
    | "preview_confirmed"
    | "published"
    | "failed";

  image: UploadedImage | null;
  overlay: CourseImageOverlay | null;
  checklist: AccuracyChecklist;
  publishResult?: PublishResult;
  versions: ProjectVersion[];
  createdAt: string;
  updatedAt: string;
};
```

### Uploaded Image

```ts
type UploadedImage = {
  id: string;
  originalFileName: string;
  localPath: string;
  mimeType: "image/png" | "image/jpeg";
  width: number;
  height: number;
  sizeBytes: number;
  previewUrl: string;
  uploadedAt: string;
};
```

### Course Image Overlay

```ts
type LngLat = [longitude: number, latitude: number];

type CourseImageOverlay = {
  id: string;
  imageId: string;
  opacity: number;
  coordinates: {
    topLeft: LngLat;
    topRight: LngLat;
    bottomRight: LngLat;
    bottomLeft: LngLat;
  };
  rotationDegrees?: number;
  accuracyLabel:
    | "rough_placement"
    | "visually_aligned"
    | "reviewed"
    | "ready_to_publish";
  notes?: string;
  updatedAt: string;
};
```

### Accuracy Checklist

```ts
type AccuracyChecklist = {
  cartPathsAligned: boolean;
  greensAligned: boolean;
  teeBoxesAligned: boolean;
  bunkersAligned: boolean;
  waterFeaturesAligned: boolean;
  surroundingRoadsAligned: boolean;
  doesNotCoverWrongProperty: boolean;
  correctCourseTarget: boolean;
  sourceApproved: boolean;
};
```

### Publish Payload

```ts
type PublishPayload = {
  projectId: string;
  courseId: string;
  courseName: string;
  environment: "sandbox" | "staging" | "production";
  image: UploadedImage;
  overlay: CourseImageOverlay;
  checklist: AccuracyChecklist;
  target: {
    type: "mapbox" | "internal_api" | "local_export";
    mapboxStyleId?: string;
    mapboxDatasetId?: string;
    apiUrl?: string;
  };
};
```

### Publish Result

```ts
type PublishResult = {
  id: string;
  status: "success" | "failed" | "partial";
  publishedAt: string;
  destination: string;
  mapboxTilesetId?: string;
  mapboxLayerId?: string;
  previewUrl?: string;
  errorMessage?: string;
};
```

---

## 20. Local Project Files

The app should save project work locally.

Recommended local project folder:

```text
ToroCourseImageryProjects/
  wicker-point-2026-06-15/
    project.json
    source-image.png
    preview-before.png
    preview-after.png
    exports/
      overlay-metadata.json
      mapbox-snippet.ts
      publish-summary.md
    logs/
      audit-log.json
      error-log.json
```

This gives the internal user something tangible and recoverable.

---

## 21. UX Copy Principles

Qwen should include UX copy that is clear, direct, and not technical.

Avoid:

```text
Georeference raster source
Transform coordinate geometry
Update style layer target
```

Use:

```text
Place image on map
Adjust alignment
Preview final map
Publish imagery
```

### Tone

- Helpful
- Calm
- Direct
- Internal-professional
- Not childish
- Not overly technical

### Example Microcopy

Sandbox label:

```text
Sandbox mode: changes are not published yet.
```

Upload helper:

```text
Use a clear aerial image of the course. You can adjust the placement in the next step.
```

Alignment helper:

```text
Use opacity to compare the uploaded image with the current map. Align roads, greens, bunkers, and water features first.
```

Publish warning:

```text
Publishing will apply this imagery to the selected course target.
```

Success message:

```text
The updated course imagery was published successfully.
```

---

## 22. Error Handling

The app must provide helpful error states.

### Upload Errors

```text
This file type is not supported. Upload a PNG or JPEG image.
```

```text
This image is too large for the current tool. Use an image under 50 MB or reduce the image size.
```

### Mapbox Errors

```text
The map could not load. Check your Mapbox token or internet connection.
```

### Publish Errors

```text
Publishing failed. Your draft is still saved locally. Review the error details and try again.
```

### Validation Errors

```text
Complete the alignment checklist before previewing the final map.
```

---

## 23. Guardrails

The app should prevent mistakes.

### Required Guardrails

- User cannot skip course selection.
- User cannot upload unsupported files.
- User cannot publish without final preview.
- User cannot publish without checklist completion.
- User cannot publish if coordinates are invalid.
- User cannot publish if target environment is missing.
- User must explicitly confirm publish.
- App must save draft before attempting publish.
- App must preserve a local copy of the project.

---

## 24. Qwen Build Instructions

Qwen must build this in small, controlled phases.

Do not ask Qwen to build the entire product in one prompt.

Use this phased approach.

---

# Phase 1: App Shell + Wizard Foundation

## Goal

Create the Electron desktop app with a Toro-branded wizard shell.

## Requirements

- Electron
- React
- TypeScript
- Vite
- Zustand
- Basic file structure
- Toro-inspired theme tokens
- Wizard shell
- Step progress
- Back/next buttons
- Step validation pattern
- Placeholder screens for all 8 steps

## Acceptance Criteria

- App launches locally.
- User sees a clean Toro-branded wizard.
- User can move between placeholder steps.
- Wizard state is stored in Zustand.
- UI uses red, white, gray, and black.
- Layout has generous white space.

## Prompt for Qwen

```text
Build an Electron + React + TypeScript + Vite desktop app called Toro Course Imagery Publisher.

Create a Toro-branded wizard interface with 8 steps:
1. Select Course
2. Confirm Target Map
3. Upload Imagery
4. Align Imagery
5. Accuracy Check
6. Preview Final Map
7. Publish
8. Success

Use a clean, spacious UI with Toro-inspired colors: red, black, white, and light grays. The design should feel like a professional internal Toro tool but simple like Airbnb.

Implement:
- WizardShell component
- WizardProgress component
- StepHeader component
- WizardFooter component
- Zustand wizard store
- Back/Next navigation
- Step validation placeholders
- Theme tokens
- Placeholder page for each step

Do not implement Mapbox yet. Focus only on the app shell, wizard structure, and polished UI foundation.
```

---

# Phase 2: Course Selection + Target Confirmation

## Goal

Allow user to choose a course and confirm the map target.

## Requirements

- Course search UI
- Mock course data
- Course details card
- Environment selection
- Confirmation checkbox
- Step validation

## Acceptance Criteria

- User can select a course.
- User can see course details.
- User can choose sandbox/staging/production.
- User must confirm target before continuing.

## Prompt for Qwen

```text
Extend the Toro Course Imagery Publisher app.

Implement Step 1 and Step 2.

Step 1: Select Course
- Add a course search input.
- Use mock course data for now.
- Show matching courses in clean cards.
- Allow the user to select one course.
- Store selected course in Zustand.

Step 2: Confirm Target Map
- Show selected course name, course ID, customer/account if available, and location.
- Add target environment selection: sandbox, staging, production.
- Add a required checkbox: "I confirm this is the correct course/map target."
- Prevent continuing until the checkbox is selected.

Keep the UI clean, spacious, and Toro-branded.
Do not add Mapbox yet.
```

---

# Phase 3: Embedded Mapbox Sandbox

## Goal

Add a Mapbox instance inside the app.

## Requirements

- Mapbox GL JS
- Token via environment variable
- Map centered on selected course
- Satellite base layer
- Map controls
- Cursor coordinates
- Clear sandbox label

## Acceptance Criteria

- Mapbox loads in Step 2 or Step 4.
- Map centers on selected course.
- User can pan/zoom.
- App clearly says sandbox mode.

## Prompt for Qwen

```text
Add Mapbox GL JS to the Electron app.

Requirements:
1. Read MAPBOX_TOKEN from environment variables.
2. Create a reusable MapboxCanvas component.
3. Render the map centered on the selected course location.
4. Use a satellite or satellite-streets style.
5. Add zoom and navigation controls.
6. Show current cursor longitude/latitude.
7. Add a visible label: "Sandbox mode: changes are not published yet."
8. Handle missing token and map load errors with friendly messages.

Use the MapboxCanvas in Step 2 for target confirmation and Step 4 for alignment.
Keep all Mapbox-specific code inside /mapbox components/services.
```

---

# Phase 4: Image Upload

## Goal

Allow the user to upload imagery.

## Requirements

- Drag/drop upload
- File picker
- PNG/JPEG validation
- File metadata
- Preview
- Replace image

## Acceptance Criteria

- User can upload valid image.
- Invalid images show error.
- Image data is stored.
- User cannot continue without image.

## Prompt for Qwen

```text
Implement Step 3: Upload Imagery.

Requirements:
1. Add drag-and-drop image upload.
2. Support PNG, JPG, and JPEG.
3. Validate file type.
4. Validate max file size of 50 MB.
5. Read image dimensions.
6. Show image preview.
7. Show file metadata: filename, size, dimensions, type.
8. Allow replacing the image.
9. Store uploaded image metadata and local object URL in Zustand.
10. Prevent continuing unless a valid image is uploaded.

Keep the UI simple, clear, and non-technical.
```

---

# Phase 5: Image Overlay Rendering

## Goal

Render the uploaded image inside the Mapbox sandbox.

## Requirements

- Add image source
- Add raster layer
- Generate default coordinates around map center
- Opacity slider
- Remove/reset overlay

## Acceptance Criteria

- Uploaded image appears on map.
- Opacity updates live.
- Image is clearly sandbox-only.

## Prompt for Qwen

```text
Implement the first version of Step 4: Align Imagery.

Requirements:
1. Show the MapboxCanvas centered on the selected course.
2. When an uploaded image exists, add it to Mapbox as an image source.
3. Use four corner coordinates around the current map center for initial placement.
4. Render the image as a raster layer above the satellite map.
5. Add an opacity slider.
6. Updating opacity should update the raster layer live.
7. Add a reset placement button.
8. Add a remove overlay button.
9. Store overlay coordinates and opacity in Zustand.
10. Display the four corner coordinates in a right-side details panel.

Keep this as a sandbox. Do not publish anything.
```

---

# Phase 6: Alignment Tools

## Goal

Add QGIS-lite manual alignment controls.

## Requirements

- Move overlay
- Scale
- Rotate
- Four draggable corners
- Keyboard nudge
- Undo/redo
- Coordinate updates

## Acceptance Criteria

- User can accurately align imagery.
- User can recover mistakes.
- UI remains simple.

## Prompt for Qwen

```text
Extend Step 4 with manual alignment tools.

Add:
1. Move mode: drag the entire overlay.
2. Corner mode: show four draggable corner handles and allow each corner to move independently.
3. Scale controls.
4. Rotate controls.
5. Keyboard nudge controls using arrow keys.
6. Shift + arrow for larger nudge.
7. Undo and redo for coordinate changes.
8. Live coordinate updates in the right panel.
9. Visual selected state for the overlay.
10. Clear tool mode labels: Move, Corners, Scale, Rotate.

Important:
- Keep all coordinate math in /georeferencing utilities.
- Keep Mapbox source updating in /mapbox services.
- Do not mix geometry logic directly into React components.
- Prioritize reliable behavior over advanced features.
```

---

# Phase 7: Accuracy Checklist

## Goal

Add validation before final preview.

## Requirements

- Checklist
- Accuracy label
- Notes
- Required confirmations

## Acceptance Criteria

- User cannot continue until required checks are complete.
- Checklist state is stored.

## Prompt for Qwen

```text
Implement Step 5: Accuracy Check.

Requirements:
1. Show a map preview with the aligned imagery.
2. Add required checklist items:
   - Cart paths align
   - Greens align
   - Tee boxes align
   - Bunkers align
   - Water features align
   - Surrounding roads or landmarks align
   - Image does not cover unrelated properties
   - Correct course target
   - Image source is approved for internal use
3. Add an accuracy label selector:
   - Rough placement
   - Visually aligned
   - Reviewed
   - Ready to publish
4. Add a notes field.
5. Prevent continuing until all required checks are selected.
6. Store checklist, accuracy label, and notes in Zustand.

Keep copy simple and helpful.
```

---

# Phase 8: Final Preview

## Goal

Show exactly what will be published.

## Requirements

- Before/after preview
- Final map
- Metadata summary
- Confirmation

## Acceptance Criteria

- User can review final map.
- User can go back if needed.
- User must confirm preview before publish.

## Prompt for Qwen

```text
Implement Step 6: Preview Final Map.

Requirements:
1. Show the selected course name and ID.
2. Show the final Mapbox preview with the aligned imagery.
3. Add preview modes:
   - Before
   - After
   - Split view if practical
4. Show metadata summary:
   - Image filename
   - Image size
   - Target environment
   - Accuracy label
   - Last saved time
5. Add a required checkbox: "I reviewed the final map preview."
6. Prevent continuing until preview is confirmed.
7. Add a clear button to return to alignment if changes are needed.

Do not publish from this step.
```

---

# Phase 9: Publish + Export

## Goal

Create the publish workflow.

## Requirements

- Build publish payload
- Export local package
- Optional Mapbox adapter placeholder
- Result screen

## Acceptance Criteria

- User can publish/export.
- App confirms result.
- Errors are handled.

## Prompt for Qwen

```text
Implement Step 7: Publish.

Requirements:
1. Show a final publish summary:
   - Course
   - Course ID
   - Environment
   - Image
   - Accuracy label
   - Checklist status
2. Add required checkbox: "I understand this will publish imagery to the selected course."
3. Add a primary Toro-red button: "Publish imagery".
4. Before publish, save the full local project state.
5. Build a PublishPayload object.
6. Implement LocalExportPublishingAdapter first.
7. Export a local package containing:
   - source image
   - overlay-metadata.json
   - mapbox-layer-snippet.ts
   - publish-summary.md
   - project.json
8. Add placeholder MapboxPublishingAdapter with method signatures only.
9. Handle publish success and failure.
10. On success, move to Step 8.

Do not call real Mapbox APIs yet unless the adapter is explicitly configured.
```

---

# Phase 10: Success Screen

## Goal

Clearly confirm successful completion.

## Requirements

- Success message
- Final preview
- Actions
- Export location

## Acceptance Criteria

- User knows the task completed.
- User knows where to go next.

## Prompt for Qwen

```text
Implement Step 8: Success.

Requirements:
1. Show a large success message: "Course imagery published successfully."
2. Show the selected course and environment.
3. Show publish timestamp.
4. Show the final map preview.
5. Show exported package location.
6. Add actions:
   - View final preview
   - Open project folder
   - Export package again
   - Start another course
   - Close app
7. Store publish result in Zustand.

Make the screen feel clear, calm, and complete.
```

---

## 25. Future Enhancements

Do not build these in MVP, but architect for them.

### GeoTIFF Support

Allow auto-placement when imagery includes geographic metadata.

### Control Points

Allow user to place matching points:

```text
Point A on image → Point A on map
Point B on image → Point B on map
Point C on image → Point C on map
```

### Raster Tile Pipeline

For large imagery, generate raster tiles instead of using one huge image.

### Real Mapbox API Publishing

Add production adapter for:

- Mapbox Uploads API
- Mapbox Tilesets API
- Style layer updates

### Internal API Integration

Add adapter for Toro internal course imagery service.

### Version History

Allow user to compare:

```text
Current published imagery
Draft imagery
Previous version
```

### Rollback

Allow publisher/admin to restore previous imagery.

### QA Review Mode

Allow a reviewer to approve or reject before final publish.

---

## 26. Definition of Done

The MVP is done when:

- User can open the desktop app.
- User can select a course.
- User can confirm the correct target map.
- User can upload a PNG/JPEG.
- User can align it over an embedded Mapbox sandbox.
- User can complete an accuracy checklist.
- User can preview the final map.
- User can export/publish a clean package.
- User gets a success confirmation.
- The app prevents obvious mistakes.
- The app feels simple, guided, and Toro-branded.

---

## 27. Final Build Philosophy

The app should not expose the user to complexity unless needed.

The workflow should feel like:

```text
Choose course.
Upload image.
Line it up.
Check it.
Preview it.
Publish it.
Done.
```

Under the hood, the app can be technical.

On the surface, it should feel easy.
