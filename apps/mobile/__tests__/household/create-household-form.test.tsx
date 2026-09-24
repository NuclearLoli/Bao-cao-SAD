import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { CreateHouseholdForm } from '@/features/household/ui/create-household-form';

describe('CreateHouseholdForm', () => {
  test('does not submit invalid input and keeps the validation message near the field', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const screen = await render(<CreateHouseholdForm onSubmit={onSubmit} />);
    const input = screen.getByLabelText('Tên hộ gia đình');

    await fireEvent.changeText(input, '   ');
    await fireEvent(input, 'blur');
    await fireEvent.press(screen.getByRole('button', { name: 'Tạo hộ gia đình' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Vui lòng nhập tên hộ gia đình.')).toBeTruthy();
  });

  test('M5 ignores a rapid second submit while the first request is pending', async () => {
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const screen = await render(<CreateHouseholdForm onSubmit={onSubmit} />);
    await fireEvent.changeText(screen.getByLabelText('Tên hộ gia đình'), 'Gia đình Nguyễn');
    const button = screen.getByRole('button', { name: 'Tạo hộ gia đình' });

    await fireEvent.press(button);
    await fireEvent.press(button);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Tạo hộ gia đình' })).toBeDisabled();

    await act(async () => resolveSubmit?.());
  });

  test('M6 keeps the form recoverable and shows a local error when storage fails', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('storage failed'));
    const screen = await render(<CreateHouseholdForm onSubmit={onSubmit} />);
    await fireEvent.changeText(screen.getByLabelText('Tên hộ gia đình'), 'Gia đình Nguyễn');
    await fireEvent.press(screen.getByRole('button', { name: 'Tạo hộ gia đình' }));

    await waitFor(() => {
      expect(screen.getByText('Không thể lưu hộ gia đình. Vui lòng thử lại.')).toBeTruthy();
    });
    expect(screen.getByLabelText('Tên hộ gia đình')).toHaveProp('value', 'Gia đình Nguyễn');
    expect(screen.getByRole('button', { name: 'Tạo hộ gia đình' })).toBeEnabled();
  });
});
