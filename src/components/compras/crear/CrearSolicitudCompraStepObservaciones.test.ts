import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import CrearSolicitudCompraStepObservaciones from './CrearSolicitudCompraStepObservaciones.vue';

describe('CrearSolicitudCompraStepObservaciones', () => {
  it('muestra chips de equipos y contextos con su estado visual', () => {
    const wrapper = mount(CrearSolicitudCompraStepObservaciones, {
      props: {
        observacion: 'Para uso en: 422006',
        solicitarUrgente: false,
        motivoUrgencia: '',
        destinos: [
          {
            id: 1,
            tipoOrigen: 'equipo',
            codigo: '422006',
            label: '422006 · Tractor',
            modelo: '6155M',
            marca: 'John Deere',
            tipo: 'Tractor',
          },
          {
            id: 2,
            tipoOrigen: 'equipo',
            codigo: '422018',
            label: '422018 · Cosechadora',
            modelo: 'S670',
            marca: 'John Deere',
            tipo: 'Cosechadora',
          },
          {
            id: 3,
            tipoOrigen: 'instalacion_taller',
            codigo: 'taller',
            label: 'Instalaciones de taller',
            modelo: null,
            marca: null,
            tipo: null,
          },
        ],
        adjuntos: [],
        adjuntosErroresRecientes: [],
      },
    });

    const references = wrapper.text();
    const textarea = wrapper.get('textarea');

    expect(references).toContain('422006');
    expect(references).toContain('422018');
    expect(references).toContain('Instalaciones de taller');
    expect(wrapper.html()).toContain('emerald');
    expect(wrapper.html()).toContain('rose');
    expect(textarea.attributes('maxlength')).toBeUndefined();
    expect(references).not.toContain('19/250');
  });

  it('emite el estado de scroll en desktop cuando llega al fondo con tolerancia', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1280,
      writable: true,
    });

    const wrapper = mount(CrearSolicitudCompraStepObservaciones, {
      props: {
        observacion: '',
        solicitarUrgente: false,
        motivoUrgencia: '',
        destinos: [],
        adjuntos: [],
        adjuntosErroresRecientes: [],
      },
    });

    const scrollContainer = wrapper.get('section > div').element as HTMLDivElement;

    Object.defineProperty(scrollContainer, 'clientHeight', {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(scrollContainer, 'scrollHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(scrollContainer, 'scrollTop', {
      configurable: true,
      value: 0,
      writable: true,
    });

    window.dispatchEvent(new Event('resize'));
    await nextTick();

    const emittedStates = wrapper.emitted('desktop-scroll-state-change');
    expect(emittedStates?.at(-1)?.[0]).toEqual({
      hasOverflow: true,
      reachedBottom: false,
    });

    scrollContainer.scrollTop = 298;
    await wrapper.get('section > div').trigger('scroll');

    expect(wrapper.emitted('desktop-scroll-state-change')?.at(-1)?.[0]).toEqual({
      hasOverflow: true,
      reachedBottom: true,
    });
  });

  it('hace visible el bloque de urgencia al activar prioridad en desktop', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1280,
      writable: true,
    });

    const wrapper = mount(CrearSolicitudCompraStepObservaciones, {
      props: {
        observacion: '',
        solicitarUrgente: false,
        motivoUrgencia: '',
        destinos: [],
        adjuntos: [],
        adjuntosErroresRecientes: [],
      },
    });

    const scrollContainer = wrapper.get('section > div').element as HTMLDivElement;
    const scrollTo = vi.fn();

    Object.defineProperty(scrollContainer, 'clientHeight', {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(scrollContainer, 'scrollTop', {
      configurable: true,
      value: 0,
      writable: true,
    });
    Object.defineProperty(scrollContainer, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });

    Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
      configurable: true,
      get: () => 420,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get: () => 140,
    });

    await wrapper.setProps({
      solicitarUrgente: true,
    });
    await nextTick();

    expect(scrollTo).toHaveBeenCalledWith({
      top: 260,
      behavior: 'smooth',
    });
  });
});
