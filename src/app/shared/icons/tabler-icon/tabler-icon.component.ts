import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, computed } from '@angular/core';

import { TABLER_ICONS, TablerIconName } from '../tabler-icons.registry';

@Component({
  selector: 'app-tabler-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabler-icon.component.html',
  styleUrl: './tabler-icon.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TablerIconComponent {
  @Input({ required: true }) name!: TablerIconName;

  /** px */
  @Input() size = 18;

  /** stroke width */
  @Input() stroke = 1.75;

  protected readonly def = computed(() => TABLER_ICONS[this.name]);
}


