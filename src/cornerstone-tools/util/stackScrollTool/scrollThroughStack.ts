import { getEnabledElement } from '@cornerstone'
import clip from '../clip'
import getTargetVolume from '../planar/getTargetVolume'
import getSliceRange from './getSliceRange'
import snapFocalPointToSlice from './snapFocalPointToSlice'

/**
 * @function scrollThroughStack Scroll the stack defined by the event (`evt`)
 * and volume with `volumeUID` `deltaFrames number of frames`.
 * Frames are defined as increasing in the view direction.
 *
 * @param {CustomEvent} evt The event corresponding to an interaction with a
 * specific viewport.
 * @param {number} deltaFrames The number of frames to jump through.
 * @param {string} volumeUID The `volumeUID` of the volume to scroll through
 * @param {boolean} invert inversion of the scrolling
 * on the viewport.
 */
export default function scrollThroughStack(
  evt,
  deltaFrames,
  volumeUID,
  invert
) {
  const { element: canvas, wheel } = evt.detail
  const enabledElement = getEnabledElement(canvas)
  const { scene, viewport } = enabledElement
  const camera = viewport.getCamera()
  const { focalPoint, viewPlaneNormal, position } = camera

  // Todo: shall we define a camera type? slabCamera for volume and default for stack?
  if (camera.slabThickness === undefined) {
    // stack viewport
    const { currentImageIdIndex } = viewport
    const numberOfFrames = viewport.imageIds.length
    const { direction } = wheel
    const stackDirection = invert ? -direction : direction
    let newImageIdIndex = currentImageIdIndex + stackDirection
    newImageIdIndex = clip(newImageIdIndex, 0, numberOfFrames - 1)
    viewport.setImageIdIndex(newImageIdIndex)
    //
    return
  }

  // Stack scroll across highest resolution volume.
  const { spacingInNormalDirection, imageVolume } = getTargetVolume(
    scene,
    camera,
    volumeUID
  )

  const volumeActor = scene.getVolumeActor(imageVolume.uid)
  const scrollRange = getSliceRange(volumeActor, viewPlaneNormal, focalPoint)

  // Todo: add inverted logic for volume camera
  const { newFocalPoint, newPosition } = snapFocalPointToSlice(
    focalPoint,
    position,
    scrollRange,
    viewPlaneNormal,
    spacingInNormalDirection,
    deltaFrames
  )

  enabledElement.viewport.setCamera({
    focalPoint: newFocalPoint,
    position: newPosition,
  })
  enabledElement.viewport.render()
}
