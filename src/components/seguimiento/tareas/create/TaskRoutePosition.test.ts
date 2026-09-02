import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import TaskRoutePosition from "./TaskRoutePosition.vue";

describe("TaskRoutePosition", () => {
  it("propone la siguiente posición y permite cambiarla", async () => {
    const wrapper = mount(TaskRoutePosition, {
      props: { order: null, totalTasks: 3 },
    });

    const input = wrapper.get<HTMLInputElement>("#create-task-route-order");
    expect(input.element.value).toBe("4");

    await input.setValue(2);

    expect(wrapper.emitted("update:order")).toEqual([[2]]);
    expect(input.attributes("max")).toBe("4");
  });
});
