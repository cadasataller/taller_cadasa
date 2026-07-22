import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CrearSolicitudCompraActionConfirmModal from './CrearSolicitudCompraActionConfirmModal.vue';

describe('CrearSolicitudCompraActionConfirmModal', () => {
  it('renderiza el contenido y emite las acciones esperadas', async () => {
    const wrapper = mount(CrearSolicitudCompraActionConfirmModal, {
      attachTo: document.body,
      props: {
        title: 'Enviar solicitud',
        description: 'Se enviara la solicitud.',
        confirmLabel: 'Confirmar envio',
        closeLabel: 'Volver',
        palette: {
          badgeClass: 'bg-main/10 text-main',
          borderClass: 'border-main/20',
          confirmButtonClass: 'bg-main',
          confirmButtonHoverClass: 'hover:bg-main-light',
          confirmButtonTextClass: 'text-white',
        },
      },
    });

    expect(document.body.textContent).toContain('Enviar solicitud');
    expect(document.body.textContent).toContain('Se enviara la solicitud.');

    const buttons = document.body.querySelectorAll('button');
    const closeButton = buttons[0] as HTMLButtonElement;
    const confirmButton = buttons[1] as HTMLButtonElement;

    closeButton.click();
    confirmButton.click();

    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(wrapper.emitted('confirm')).toHaveLength(1);

    wrapper.unmount();
  });
});
