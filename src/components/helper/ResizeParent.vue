<template>
  <div
    @mousedown="startDrag"
    :style="style"
    class="resize-handle" />
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

export interface ElementGeometry {
  width: number
  height: number
  offsetX: number
  offsetY: number
}

@Component
export default class ResizeParent extends Vue {

  @Prop({default: false}) left: boolean|string
  @Prop({default: false}) right: boolean|string
  @Prop({default: false}) top: boolean|string
  @Prop({default: false}) bottom: boolean|string
  @Prop({default: 'resizing'}) resizingClass: string
  @Prop({default: 10}) parentMinWidth: number

  startX = 0
  startY = 0
  startCursor: string|null = null
  parentStartGeometry: ElementGeometry|null = null
  previousStartGeometry: ElementGeometry|null = null
  nextStartGeometry: ElementGeometry|null = null
  rightMax = Infinity
  leftMin = 0
  resetState() {
    this.startX = 0
    this.startY = 0
    this.startCursor = null
    this.parentStartGeometry = null
    this.previousStartGeometry = null
    this.nextStartGeometry = null
    this.rightMax = Infinity
    this.leftMin = 0
  }

  get parent() {
    return this.$el.parentElement as HTMLElement
  }
  get next() {
    // TODO: SANITY
    return this.parent.nextSibling as HTMLElement
  }
  get previous() {
    // TODO: SANITY
    return this.parent.previousSibling as HTMLElement
  }

  get side() {
    if (this.left !== false) {
      return 'left'
    } else if (this.right !== false) {
      return 'right'
    } else if (this.top !== false) {
      return 'top'
    } else if (this.bottom !== false) {
      return 'bottom'
    } else {
      // default
      return 'right'
    }
  }

  get cursor() {
    return this.side === 'left' || this.side === 'right' ? 'ew-resize' : 'ns-resize'
  }

  get style() {
    return {
      left: this.side === 'right' ? 'auto' : 0,
      right: this.side === 'left' ? 'auto' : 0,
      top: this.side === 'bottom' ? 'auto' : 0,
      bottom: this.side === 'top' ? 'auto' : 0,
      width: this.side === 'top' || this.side === 'bottom' ? '100%' : '8px',
      height: this.side === 'left' || this.side === 'right' ? '100%' : '8px',
      cursor: this.cursor
    }
  }

  getOverlapX(left: HTMLElement, right: HTMLElement): number {
    return (left.offsetLeft + left.offsetWidth) - right.offsetLeft
  }

  drag(e: MouseEvent) {
    requestAnimationFrame(() => {
      if (this.parentStartGeometry !== null) {
        if (this.side === 'right') {
          const newWidth = this.parentStartGeometry.width + (e.pageX - this.startX)
          // no next element
          if (this.nextStartGeometry === null) {
            this.parent.style.width = newWidth + 'px'
          // there is a next element
          } else {
            // it’s within the boundaries
            if (this.parent.offsetLeft + newWidth < this.rightMax) {
              this.parent.style.width = newWidth + 'px'
              // move away next element
              const overlap = this.getOverlapX(this.parent, this.next)
              if (overlap > 0) {
                this.next.style.width = this.next.offsetWidth - overlap + 'px'
                this.next.style.left = this.next.offsetLeft + overlap + 'px'
              } else if (this.next.offsetLeft > (this.nextStartGeometry as ElementGeometry).offsetX) {
                this.next.style.left = this.next.offsetLeft + overlap + 'px'
                this.next.style.width = this.next.offsetWidth - overlap + 'px'
              }
            // it’s not: maximize and stop
            } else {
              this.parent.style.width = this.rightMax - (this.parentStartGeometry as ElementGeometry).offsetX + 'px'
              this.next.style.left = this.rightMax + 'px'
              this.next.style.width = this.parentMinWidth + 'px'
            }
          }
        } else if (this.side === 'left') {
          const newWidth = this.parentStartGeometry.width - (e.pageX - this.startX)
          const newLeft = this.parentStartGeometry.offsetX + (e.pageX - this.startX)
          if (this.previousStartGeometry === null) {
            this.parent.style.width = newWidth + 'px'
            this.parent.style.left = newLeft + 'px'
          } else {
            if (newLeft > this.leftMin) {
              this.parent.style.width = newWidth + 'px'
              this.parent.style.left = newLeft + 'px'
              // move away prev element
              const overlap = this.getOverlapX(this.previous, this.parent)
              if (overlap > 0) {
                this.previous.style.width = this.previous.offsetWidth - overlap + 'px'
              } else if (this.previous.offsetWidth < this.previousStartGeometry.width) {
                this.previous.style.width = this.previous.offsetWidth - overlap + 'px'
              }
            } else {
              this.parent.style.width = (this.parentStartGeometry.offsetX + this.parentStartGeometry.width) - this.leftMin + 'px'
              this.parent.style.left = this.leftMin + 'px'
              this.previous.style.width = this.parentMinWidth + 'px'
            }
          }
        }
      }
    })
  }
  endDrag() {
    document.removeEventListener('mousemove', this.drag)
    document.removeEventListener('mouseup', this.endDrag)
    document.removeEventListener('keyup', this.cancelDrag)
    document.body.style.cursor = this.startCursor
    if (this.next instanceof HTMLElement) {
      this.next.classList.remove(this.resizingClass)
    }
    if (this.previous instanceof HTMLElement) {
      this.previous.classList.remove(this.resizingClass)
    }
    this.parent.classList.remove(this.resizingClass)
    this.resetState()
    this.$emit('resize-end', {
      current: {
        left: this.parent.offsetLeft,
        right: this.parent.offsetLeft + this.parent.offsetWidth
      },
      next: {
        left: this.next instanceof HTMLElement
          ? this.next.offsetLeft
          : null,
        right: this.next instanceof HTMLElement
          ? this.next.offsetLeft + this.next.offsetWidth
          : null
      },
      previous: {
        left: this.previous instanceof HTMLElement
          ? this.previous.offsetLeft
          : null,
        right: this.previous instanceof HTMLElement
          ? this.previous.offsetLeft + this.previous.offsetWidth
          : null
      }
    })
  }
  cancelDrag(e: KeyboardEvent) {
    if (e.code === 'Escape' || e.key === 'Escape') {
      if (this.parentStartGeometry !== null) {
        this.parent.style.width = this.parentStartGeometry.width + 'px'
        this.parent.style.left = this.parentStartGeometry.offsetX + 'px'
      }
      if (this.nextStartGeometry !== null) {
        this.next.style.width = this.nextStartGeometry.width + 'px'
        this.next.style.left = this.nextStartGeometry.offsetX + 'px'
      }
      if (this.previousStartGeometry !== null) {
        this.previous.style.width = this.previousStartGeometry.width + 'px'
        this.previous.style.left = this.previousStartGeometry.offsetX + 'px'
      }
      this.endDrag()
    }
  }
  getGeometry(n: HTMLElement) {
    if (n instanceof HTMLElement) {
      return {
        width: n.offsetWidth,
        height: n.offsetHeight,
        offsetX: n.offsetLeft,
        offsetY: n.offsetTop
      }
    } else {
      return null
    }
  }
  startDrag(e: MouseEvent) {
    this.startCursor = document.body.style.cursor
    this.startX = e.pageX,
    this.startY = e.pageY,
    this.parentStartGeometry = this.getGeometry(this.parent)
    this.previousStartGeometry = this.getGeometry(this.previous)
    this.nextStartGeometry = this.getGeometry(this.next)
    this.rightMax = this.nextStartGeometry === null
      ? Infinity
      : this.nextStartGeometry.offsetX + this.nextStartGeometry.width - this.parentMinWidth
    this.leftMin = this.previousStartGeometry === null
      ? 0
      : this.previousStartGeometry.offsetX + this.parentMinWidth
    requestAnimationFrame(() => {
      if (this.next instanceof HTMLElement) {
        this.next.classList.add(this.resizingClass)
      }
      if (this.previous instanceof HTMLElement) {
        this.previous.classList.add(this.resizingClass)
      }
      this.parent.classList.add(this.resizingClass)
      document.body.style.cursor = this.cursor
      document.addEventListener('mousemove', this.drag)
      document.addEventListener('mouseup', this.endDrag)
      document.addEventListener('keyup', this.cancelDrag)
    })
  }
}
</script>
<style lang="stylus" scoped>
.resize-handle
  z-index 100
  -webkit-app-region no-drag
  position absolute
  background rgba(0,0,0,.35)
</style>
