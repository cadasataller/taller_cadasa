import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';

import CrearSolicitudCompraStepResumen from './CrearSolicitudCompraStepResumen.vue';

describe('CrearSolicitudCompraStepResumen', () => {
  it('emite el estado de scroll en desktop cuando el resumen tiene overflow', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1280,
      writable: true,
    });

    const wrapper = mount(CrearSolicitudCompraStepResumen, {
      props: {
        tipoSolicitud: 'otros',
        fechaEntrega: '2026-06-29',
        destinos: [],
        productos: [],
        servicios: [],
        observacion: 'Resumen',
        adjuntos: [],
        solicitarUrgente: false,
        motivoUrgencia: '',
      },
    });

    const scrollContainer = wrapper.get('section > div').element as HTMLDivElement;

    Object.defineProperty(scrollContainer, 'clientHeight', {
      configurable: true,
      value: 320,
    });
    Object.defineProperty(scrollContainer, 'scrollHeight', {
      configurable: true,
      value: 640,
    });
    Object.defineProperty(scrollContainer, 'scrollTop', {
      configurable: true,
      value: 0,
      writable: true,
    });

    window.dispatchEvent(new Event('resize'));
    await nextTick();

    expect(wrapper.emitted('desktop-scroll-state-change')?.at(-1)?.[0]).toEqual({
      hasOverflow: true,
      reachedBottom: false,
    });

    scrollContainer.scrollTop = 318;
    await wrapper.get('section > div').trigger('scroll');

    expect(wrapper.emitted('desktop-scroll-state-change')?.at(-1)?.[0]).toEqual({
      hasOverflow: true,
      reachedBottom: true,
    });
  });
});
