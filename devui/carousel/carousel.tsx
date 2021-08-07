import { defineComponent, ref, watch, onMounted, Fragment, Comment } from "vue";
import { carouselProps, DotTrigger } from "./types";

import "./carousel.scss";

export default defineComponent({
  name: "d-carousel",
  emits: ["update:activeIndex", "activeIndexChange"],
  props: carouselProps,
  setup(props, { emit }) {
    const { arrowTrigger, autoplay, autoplaySpeed, dotTrigger, activeIndex } =
      props;
    const transitionSpeed = 500;

    const itemCount = ref(0);
    const showArrow = ref(false);
    const currentIndex = ref(0);
    const wrapperRef = ref<HTMLElement | null>(null);
    const containerRef = ref<HTMLElement | null>(null);
    const scheduledId = ref<number | null>(null);

    watch(
      () => arrowTrigger,
      () => {
        showArrow.value = arrowTrigger === "always";
      },
      { immediate: true }
    );
    watch(
      () => activeIndex,
      () => {
        currentIndex.value = activeIndex;
      }
    );

    // 翻页位移
    const translatePosition = (size: number) => {
      if (containerRef.value) containerRef.value.style.left = `${-size * 100}%`;
    };
    // 调整首尾翻页后的动画
    const adjustTransition = (targetEl: HTMLElement) => {
      setTimeout(() => {
        if (containerRef.value) containerRef.value.style.transition = "";

        targetEl.style.transform = "";
        translatePosition(currentIndex.value);
      }, transitionSpeed);
    };

    // 调整首尾翻动时的位置
    const adjustPosition = (targetEl: HTMLElement, firstToLast: boolean) => {
      if (wrapperRef.value) {
        const wrapperRect = wrapperRef.value.getBoundingClientRect();

        targetEl.style.transform = `translateX(${
          (firstToLast ? -itemCount.value : itemCount.value) * wrapperRect.width
        }px)`;
      }
    };

    // 指定跳转位置
    const goto = (index: number) => {
      if (
        index === currentIndex.value ||
        !wrapperRef.value ||
        !containerRef.value
      )
        return;

      containerRef.value.style.transition = `left ${transitionSpeed}ms ease`;

      let latestIndex = currentIndex.value;
      if (index < 0 && currentIndex.value === 0) {
        // 第一个卡片向前切换
        latestIndex = itemCount.value - 1;
        const targetEl = containerRef.value.children[
          latestIndex
        ] as HTMLElement;
        adjustPosition(targetEl, true);
        translatePosition(-1);
        adjustTransition(targetEl);
      } else if (
        index >= itemCount.value &&
        currentIndex.value === itemCount.value - 1
      ) {
        // 最后一个卡片向后切换
        latestIndex = 0;

        const targetEl = containerRef.value.children[
          latestIndex
        ] as HTMLElement;
        adjustPosition(targetEl, false);
        translatePosition(itemCount.value);
        adjustTransition(targetEl);
      } else {
        latestIndex =
          index < 0
            ? 0
            : index > itemCount.value - 1
            ? itemCount.value - 1
            : index;

        translatePosition(latestIndex);
      }

      currentIndex.value = latestIndex;
      emit("update:activeIndex", latestIndex);
      emit("activeIndexChange", latestIndex);
      autoScheduleTransition();
    };
    // 向前切换
    const prev = () => {
      goto(currentIndex.value - 1);
    };
    // 向后切换
    const next = () => {
      goto(currentIndex.value + 1);
    };

    // 切换箭头监听事件，用于处理hover方式
    const arrowMouseEvent = (type: "enter" | "leave") => {
      if (arrowTrigger !== "hover") return;

      showArrow.value = type === "enter";
    };
    // 指示器触发切换函数
    const switchStep = (index: number, type: DotTrigger) => {
      if (type === dotTrigger) goto(index);
    };

    // 清除自动轮播任务
    const clearScheduledTransition = () => {
      if (scheduledId.value) {
        clearTimeout(scheduledId.value);
        scheduledId.value = null;
      }
    };
    // 自动轮播调度任务
    const autoScheduleTransition = () => {
      clearScheduledTransition();
      if (autoplay && autoplaySpeed) {
        scheduledId.value = setTimeout(() => {
          next();
        }, autoplaySpeed);
      }
    };
    const changeItemCount = (val: number) => {
      itemCount.value = val;
      autoScheduleTransition();
    };

    onMounted(() => {
      if (containerRef.value) {
        containerRef.value.style.transition = `left ${transitionSpeed}ms ease`;
        containerRef.value.style.left = "0%";
      }

      autoScheduleTransition();
    });

    return {
      wrapperRef,
      containerRef,

      showArrow,
      currentIndex,
      itemCount,
      changeItemCount,

      goto,
      prev,
      next,
      arrowMouseEvent,
      switchStep,
    };
  },

  render() {
    const {
      showArrow,
      currentIndex,
      itemCount,

      arrowTrigger,
      height,
      showDots,
      dotPosition,

      prev,
      next,
      arrowMouseEvent,
      switchStep,
      changeItemCount,

      $slots,
    } = this;
    const slot: any[] = $slots.default?.() ?? [];

    // 在jsx中，使用map生成slot项会在外层包裹一个Fragment
    let children = slot;
    if (children.length === 1 && children[0].type === Fragment) {
      children = (children[0].children || []).filter(
        (item) => item?.type !== Comment
      );
    }
    if (children.length !== itemCount) {
      changeItemCount(children.length);
    }

    return (
      <div
        class="devui-carousel-container"
        style={{ height }}
        onMouseenter={() => arrowMouseEvent("enter")}
        onMouseleave={() => arrowMouseEvent("leave")}
      >
        {/* carousel arrow */}
        {arrowTrigger !== "never" && showArrow ? (
          <div class="devui-carousel-arrow">
            <button class="arrow-left" onClick={() => prev()}>
              <svg width="18px" height="18px" viewBox="0 0 16 16" version="1.1">
                <g
                  stroke="none"
                  stroke-width="1"
                  fill="none"
                  fill-rule="evenodd"
                >
                  <polygon
                    fill="#293040"
                    fill-rule="nonzero"
                    points="10.7071068 12.2928932 9.29289322 13.7071068 3.58578644 8 9.29289322 2.29289322 10.7071068 3.70710678 6.41421356 8"
                  ></polygon>
                </g>
              </svg>
            </button>
            <button class="arrow-right" onClick={() => next()}>
              <svg width="18px" height="18px" viewBox="0 0 16 16" version="1.1">
                <g
                  stroke="none"
                  stroke-width="1"
                  fill="none"
                  fill-rule="evenodd"
                >
                  <polygon
                    fill="#293040"
                    fill-rule="nonzero"
                    transform="translate(8.146447, 8.000000) scale(-1, 1) translate(-8.146447, -8.000000) "
                    points="11.7071068 12.2928932 10.2928932 13.7071068 4.58578644 8 10.2928932 2.29289322 11.7071068 3.70710678 7.41421356 8"
                  ></polygon>
                </g>
              </svg>
            </button>
          </div>
        ) : null}
        {/* carousel items */}
        <div class="devui-carousel-item-wrapper" ref="wrapperRef">
          <div
            class="devui-carousel-item-container"
            style={{
              width: `${itemCount * 100}%`,
            }}
            ref="containerRef"
          >
            {slot}
          </div>
        </div>

        {/* carousel dots */}
        {itemCount > 0 && showDots ? (
          <ul class={["devui-carousel-dots", dotPosition]}>
            {children.map((_, index) => (
              <li
                class={{ "dot-item": true, active: currentIndex === index }}
                onClick={() => switchStep(index, "click")}
                onMouseenter={() => switchStep(index, "hover")}
              />
            ))}
          </ul>
        ) : null}
      </div>
    );
  },
});
