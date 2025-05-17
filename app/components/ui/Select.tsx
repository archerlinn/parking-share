"use client";

import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: Option[];
  placeholder?: string;
  multiple?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = '請選擇...',
  multiple = false,
  fullWidth = false,
  disabled = false,
}: SelectProps) {
  const selectedOptions = multiple
    ? options.filter(option => (value as string[]).includes(option.value))
    : options.find(option => option.value === value);

  return (
    <Listbox
      value={value}
      onChange={onChange}
      multiple={multiple}
      disabled={disabled}
    >
      <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
        <Listbox.Button
          className={`relative cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          } ${fullWidth ? 'w-full' : ''}`}
        >
          <span className="block truncate">
            {multiple
              ? selectedOptions.length > 0
                ? `${selectedOptions.length} 個選項已選擇`
                : placeholder
              : selectedOptions
              ? (selectedOptions as Option).label
              : placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {options.map((option) => (
              <Listbox.Option
                key={option.value}
                className={({ active }) =>
                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                    active ? 'bg-rose-100 text-rose-900' : 'text-gray-900'
                  }`
                }
                value={option.value}
              >
                {({ selected, active }) => (
                  <>
                    <span
                      className={`block truncate ${
                        selected ? 'font-medium' : 'font-normal'
                      }`}
                    >
                      {option.label}
                    </span>
                    {selected ? (
                      <span
                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                          active ? 'text-rose-600' : 'text-rose-500'
                        }`}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
} 