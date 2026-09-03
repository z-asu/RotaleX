import Swal from 'sweetalert2'
import { getTheme } from './theme'

const swalTheme = () => {
  const dark = getTheme() === 'dark'
  return {
    background: dark ? '#131b2c' : '#ffffff',
    color: dark ? '#e8edf7' : '#1a2338',
    confirmButtonColor: '#6c5ce7',
    cancelButtonColor: dark ? '#1f2b42' : '#dde2ee',
  }
}

export function confirmDelete(title, text) {
  return Swal.fire({
    ...swalTheme(),
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#ff4d6d',
    reverseButtons: true,
  }).then((result) => result.isConfirmed)
}

export function showError(message) {
  return Swal.fire({
    ...swalTheme(),
    title: 'Failed',
    text: message,
    icon: 'error',
    confirmButtonText: 'OK',
  })
}

export function showSuccess(title, text) {
  return Swal.fire({
    ...swalTheme(),
    title,
    text: text || '',
    icon: 'success',
    confirmButtonText: 'OK',
    timer: 2000,
    timerProgressBar: true,
  })
}

export function showToast(title, icon = 'success') {
  return Swal.fire({
    ...swalTheme(),
    title,
    icon,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
  })
}
