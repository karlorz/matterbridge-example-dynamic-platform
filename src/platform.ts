import {
  ClusterId,
  DeviceTypes,
  Endpoint,
  FlowMeasurement,
  OnOffCluster,
  PlatformConfig,
  RelativeHumidityMeasurement,
  TemperatureMeasurement,
  Thermostat,
  ThermostatCluster,
  WindowCovering,
  // WindowCoveringCluster,
  onOffSwitch,
  powerSource,
} from 'matterbridge';
import { Matterbridge, MatterbridgeDevice, MatterbridgeDynamicPlatform } from 'matterbridge';
// import { isValidBoolean, isValidNumber } from 'matterbridge/utils';
import { AnsiLogger, db, hk, or } from 'matterbridge/logger';

export class ExampleMatterbridgeDynamicPlatform extends MatterbridgeDynamicPlatform {
  switch: MatterbridgeDevice | undefined;
  lightOnOff: MatterbridgeDevice | undefined;
  dimmer: MatterbridgeDevice | undefined;
  light: MatterbridgeDevice | undefined;
  lightXY: MatterbridgeDevice | undefined;
  lightHS: MatterbridgeDevice | undefined;
  lightCT: MatterbridgeDevice | undefined;
  outlet: MatterbridgeDevice | undefined;
  cover: MatterbridgeDevice | undefined;
  lock: MatterbridgeDevice | undefined;
  thermo: MatterbridgeDevice | undefined;
  fan: MatterbridgeDevice | undefined;
  waterLeak: MatterbridgeDevice | undefined;
  waterFreeze: MatterbridgeDevice | undefined;
  rain: MatterbridgeDevice | undefined;
  smoke: MatterbridgeDevice | undefined;
  airQuality: MatterbridgeDevice | undefined;

  switchInterval: NodeJS.Timeout | undefined;
  lightInterval: NodeJS.Timeout | undefined;
  outletInterval: NodeJS.Timeout | undefined;
  coverInterval: NodeJS.Timeout | undefined;
  lockInterval: NodeJS.Timeout | undefined;
  thermoInterval: NodeJS.Timeout | undefined;
  fanInterval: NodeJS.Timeout | undefined;
  waterLeakInterval: NodeJS.Timeout | undefined;
  waterFreezeInterval: NodeJS.Timeout | undefined;
  rainInterval: NodeJS.Timeout | undefined;
  smokeInterval: NodeJS.Timeout | undefined;
  airQualityInterval: NodeJS.Timeout | undefined;

  constructor(matterbridge: Matterbridge, log: AnsiLogger, config: PlatformConfig) {
    super(matterbridge, log, config);
    this.log.info('Initializing platform:', this.config.name);
  }

  override async onStart(reason?: string) {
    this.log.info('onStart called with reason:', reason ?? 'none');

    // Create a switch device
    this.switch = new MatterbridgeDevice(onOffSwitch, undefined, this.config.debug as boolean);
    this.switch.log.logName = 'Switch';
    this.switch.createDefaultIdentifyClusterServer();
    this.switch.createDefaultGroupsClusterServer();
    this.switch.createDefaultScenesClusterServer();
    this.switch.createDefaultBridgedDeviceBasicInformationClusterServer('Switch', '0x23452164', 0xfff1, 'Luligu', 'Matterbridge Switch');
    this.switch.createDefaultOnOffClusterServer();
    this.switch.addDeviceType(powerSource);
    this.switch.createDefaultPowerSourceRechargeableBatteryClusterServer(70);
    await this.registerDevice(this.switch);

    this.switch.addCommandHandler('identify', async ({ request: { identifyTime } }) => {
      this.log.info(`Command identify called identifyTime:${identifyTime}`);
    });
    this.switch.addCommandHandler('on', async () => {
      this.switch?.setAttribute(OnOffCluster.id, 'onOff', true, this.switch.log, this.switch);
      this.switch?.log.info('Command on called');
    });
    this.switch.addCommandHandler('off', async () => {
      this.switch?.setAttribute(OnOffCluster.id, 'onOff', false, this.switch.log, this.switch);
      this.switch?.log.info('Command off called');
    });
    /*
    addCommandHandler(
      OnOffCluster.id,
      'on',
      async (data) => {
        this.switch?.setAttribute(OnOffCluster.id, 'onOff', true, this.switch.log, this.switch);
        this.switch?.log.info(`Command on called with: ${data}`);
      },
      this.switch.log,
      this.switch,
    );
    addCommandHandler(
      OnOffCluster.id,
      'off',
      async (data) => {
        this.switch?.setAttribute(OnOffCluster.id, 'onOff', false, this.switch.log, this.switch);
        this.switch?.log.info(`Command off called with: ${data}`);
      },
      this.switch.log,
      this.switch,
    );
    */

    // Create a window covering device
    // Matter uses 10000 = fully closed   0 = fully opened
    this.cover = new MatterbridgeDevice(DeviceTypes.WINDOW_COVERING, undefined, this.config.debug as boolean);
    this.cover.log.logName = 'Cover';
    this.cover.createDefaultIdentifyClusterServer();
    this.cover.createDefaultGroupsClusterServer();
    this.cover.createDefaultScenesClusterServer();
    this.cover.createDefaultBridgedDeviceBasicInformationClusterServer('Cover', '0x01020564', 0xfff1, 'Luligu', 'Matterbridge Cover');
    this.cover.createDefaultWindowCoveringClusterServer();
    this.cover.addDeviceType(powerSource);
    this.cover.createDefaultPowerSourceRechargeableBatteryClusterServer(86);
    await this.registerDevice(this.cover);

    this.cover.addCommandHandler('identify', async ({ request: { identifyTime } }) => {
      this.cover?.log.info(`Command identify called identifyTime:${identifyTime}`);
    });

    this.cover.addCommandHandler('stopMotion', async ({ attributes: { currentPositionLiftPercent100ths, targetPositionLiftPercent100ths, operationalStatus } }) => {
      this.cover?.setWindowCoveringTargetAsCurrentAndStopped();
      this.cover?.log.info(
        `Command stopMotion called: current ${currentPositionLiftPercent100ths?.getLocal()} target ${targetPositionLiftPercent100ths?.getLocal()} status ${operationalStatus?.getLocal().lift}`,
      );
    });

    this.cover.addCommandHandler('downOrClose', async ({ attributes: { currentPositionLiftPercent100ths, targetPositionLiftPercent100ths, operationalStatus } }) => {
      this.cover?.setWindowCoveringCurrentTargetStatus(10000, 10000, WindowCovering.MovementStatus.Stopped);
      this.cover?.log.info(
        `Command downOrClose called: current ${currentPositionLiftPercent100ths?.getLocal()} target ${targetPositionLiftPercent100ths?.getLocal()} status ${operationalStatus?.getLocal().lift}`,
      );
    });

    this.cover.addCommandHandler('upOrOpen', async ({ attributes: { currentPositionLiftPercent100ths, targetPositionLiftPercent100ths, operationalStatus } }) => {
      this.cover?.setWindowCoveringCurrentTargetStatus(0, 0, WindowCovering.MovementStatus.Stopped);
      this.cover?.log.info(
        `Command upOrOpen called: current ${currentPositionLiftPercent100ths?.getLocal()} target ${targetPositionLiftPercent100ths?.getLocal()} status ${operationalStatus?.getLocal().lift}`,
      );
    });

    this.cover.addCommandHandler(
      'goToLiftPercentage',
      async ({ request: { liftPercent100thsValue }, attributes: { currentPositionLiftPercent100ths, targetPositionLiftPercent100ths, operationalStatus } }) => {
        this.cover?.setWindowCoveringCurrentTargetStatus(liftPercent100thsValue, liftPercent100thsValue, WindowCovering.MovementStatus.Stopped);
        this.cover?.log.info(
          `Command goToLiftPercentage ${liftPercent100thsValue} called: current ${currentPositionLiftPercent100ths?.getLocal()} target ${targetPositionLiftPercent100ths?.getLocal()} status ${operationalStatus?.getLocal().lift}`,
        );
      },
    );

    // Create a thermostat device
    this.thermo = new MatterbridgeDevice(DeviceTypes.THERMOSTAT, undefined, this.config.debug as boolean);
    this.thermo.log.logName = 'Thermostat';
    this.thermo.createDefaultIdentifyClusterServer();
    this.thermo.createDefaultGroupsClusterServer();
    this.thermo.createDefaultScenesClusterServer();
    this.thermo.createDefaultBridgedDeviceBasicInformationClusterServer('Thermostat', '0x96382164', 0xfff1, 'Luligu', 'Matterbridge Thermostat');
    this.thermo.createDefaultThermostatClusterServer(20, 18, 22);
    this.thermo.addDeviceType(powerSource);
    this.thermo.createDefaultPowerSourceRechargeableBatteryClusterServer(70);

    const flowChild = this.thermo.addChildDeviceTypeWithClusterServer('Flow', [DeviceTypes.FLOW_SENSOR], [FlowMeasurement.Cluster.id]);
    flowChild.getClusterServer(FlowMeasurement.Cluster)?.setMeasuredValueAttribute(1 * 10);

    const tempChild = this.thermo.addChildDeviceTypeWithClusterServer('Temperature', [DeviceTypes.TEMPERATURE_SENSOR], [TemperatureMeasurement.Cluster.id]);
    tempChild.getClusterServer(TemperatureMeasurement.Cluster)?.setMeasuredValueAttribute(41 * 100);

    const humidityChild = this.thermo.addChildDeviceTypeWithClusterServer('Humidity', [DeviceTypes.HUMIDITY_SENSOR], [RelativeHumidityMeasurement.Cluster.id]);
    humidityChild.getClusterServer(RelativeHumidityMeasurement.Cluster)?.setMeasuredValueAttribute(80 * 100);

    await this.registerDevice(this.thermo);

    this.thermo.addCommandHandler('identify', async ({ request: { identifyTime } }) => {
      this.thermo?.log.info(`Command identify called identifyTime:${identifyTime}`);
    });
    this.thermo.addCommandHandler('setpointRaiseLower', async ({ request: { mode, amount }, attributes }) => {
      const lookupSetpointAdjustMode = ['Heat', 'Cool', 'Both'];
      this.thermo?.log.info(`Command setpointRaiseLower called with mode: ${lookupSetpointAdjustMode[mode]} amount: ${amount / 10}`);
      if (mode === /* Thermostat.SetpointRaiseLowerMode.Heat*/ 0 && attributes.occupiedHeatingSetpoint) {
        const setpoint = attributes.occupiedHeatingSetpoint?.getLocal() / 100 + amount / 10;
        attributes.occupiedHeatingSetpoint.setLocal(setpoint * 100);
        this.thermo?.log.info('Set occupiedHeatingSetpoint:', setpoint);
      }
      if (mode === /* Thermostat.SetpointRaiseLowerMode.Cool*/ 1 && attributes.occupiedCoolingSetpoint) {
        const setpoint = attributes.occupiedCoolingSetpoint.getLocal() / 100 + amount / 10;
        attributes.occupiedCoolingSetpoint.setLocal(setpoint * 100);
        this.thermo?.log.info('Set occupiedCoolingSetpoint:', setpoint);
      }
    });
    const thermostat = this.thermo.getClusterServer(ThermostatCluster.with(Thermostat.Feature.Heating, Thermostat.Feature.Cooling, Thermostat.Feature.AutoMode));
    if (thermostat) {
      subscribeAttribute(
        ThermostatCluster.id,
        'systemMode',
        async (value) => {
          const lookupSystemMode = ['Off', 'Auto', '', 'Cool', 'Heat', 'EmergencyHeat', 'Precooling', 'FanOnly', 'Dry', 'Sleep'];
          this.thermo?.log.info('Subscribe systemMode called with:', lookupSystemMode[value]);
        },
        this.thermo.log,
        this.thermo,
      );
      subscribeAttribute(
        ThermostatCluster.id,
        'occupiedHeatingSetpoint',
        async (value) => {
          this.thermo?.log.info('Subscribe occupiedHeatingSetpoint called with:', value / 100);
        },
        this.thermo.log,
        this.thermo,
      );
      subscribeAttribute(
        ThermostatCluster.id,
        'occupiedCoolingSetpoint',
        async (value) => {
          this.thermo?.log.info('Subscribe occupiedCoolingSetpoint called with:', value / 100);
        },
        this.thermo.log,
        this.thermo,
      );
    }
  }

  override async onConfigure() {
    this.log.info('onConfigure called');

    // Set switch to off
    this.switch?.setAttribute(OnOffCluster.id, 'onOff', false, this.switch.log);
    this.switch?.log.info('Set switch initial onOff to false');
    /*     // Toggle switch onOff every minute
    this.switchInterval = setInterval(
      () => {
        const status = this.switch?.getAttribute(OnOffCluster.id, 'onOff', this.switch.log);
        if (isValidBoolean(status)) {
          this.switch?.setAttribute(OnOffCluster.id, 'onOff', !status, this.switch.log);
          this.switch?.log.info(`Set switch onOff to ${!status}`);
        }
      },
      60 * 1000 + 100,
    ); */

    // Set cover to target = current position and status to stopped (current position is persisted in the cluster)
    this.cover?.setWindowCoveringTargetAsCurrentAndStopped();
    this.cover?.log.info('Set cover initial targetPositionLiftPercent100ths = currentPositionLiftPercent100ths and operationalStatus to Stopped.');
    /*     // Increment cover position every minute
    this.coverInterval = setInterval(
      () => {
        let position = this.cover?.getAttribute(WindowCoveringCluster.id, 'currentPositionLiftPercent100ths', this.cover.log);
        if (isValidNumber(position, 0, 10000)) {
          position = position > 9000 ? 0 : position + 1000;
          this.cover?.setAttribute(WindowCoveringCluster.id, 'targetPositionLiftPercent100ths', position, this.cover.log);
          this.cover?.setAttribute(WindowCoveringCluster.id, 'currentPositionLiftPercent100ths', position, this.cover.log);
          this.cover?.setAttribute(
            WindowCoveringCluster.id,
            'operationalStatus',
            { global: WindowCovering.MovementStatus.Stopped, lift: WindowCovering.MovementStatus.Stopped, tilt: WindowCovering.MovementStatus.Stopped },
            this.cover.log,
          );
          this.cover?.log.info(`Set cover current and target positionLiftPercent100ths to ${position} and operationalStatus to Stopped`);
        }
      },
      60 * 1000 + 400,
    ); */

    // Set local to 16°C
    this.thermo?.setAttribute(ThermostatCluster.id, 'localTemperature', 1600, this.thermo.log);
    this.thermo?.setAttribute(ThermostatCluster.id, 'systemMode', Thermostat.SystemMode.Auto, this.thermo.log);
    this.thermo?.log.info('Set thermostat initial localTemperature to 16°C and mode Auto');
    /*     // Increment localTemperature every minute
    this.thermoInterval = setInterval(
      () => {
        let temperature = this.thermo?.getAttribute(ThermostatCluster.id, 'localTemperature', this.thermo.log);
        if (isValidNumber(temperature, 1600, 2400)) {
          temperature = temperature + 100 >= 2400 ? 1600 : temperature + 100;
          this.thermo?.setAttribute(ThermostatCluster.id, 'localTemperature', temperature, this.thermo.log);
          this.thermo?.log.info(`Set thermostat localTemperature to ${temperature / 100}°C`);
        }
      },
      60 * 1000 + 600,
    ); */
  }

  override async onShutdown(reason?: string) {
    this.log.info('onShutdown called with reason:', reason ?? 'none');
    clearInterval(this.switchInterval);
    clearInterval(this.coverInterval);
    clearInterval(this.thermoInterval);
    if (this.config.unregisterOnShutdown === true) await this.unregisterAllDevices();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function subscribeAttribute(clusterId: ClusterId, attribute: string, listener: (newValue: any, oldValue: any) => void, log?: AnsiLogger, endpoint?: Endpoint): boolean {
  // if (!endpoint) endpoint = this as Endpoint;
  if (!endpoint) return false;

  const clusterServer = endpoint.getClusterServerById(clusterId);
  if (!clusterServer) {
    log?.error(`subscribeAttribute error: Cluster ${clusterId} not found on endpoint ${endpoint.name}:${endpoint.number}`);
    return false;
  }
  const capitalizedAttributeName = attribute.charAt(0).toUpperCase() + attribute.slice(1);
  if (!clusterServer.isAttributeSupportedByName(attribute) && !clusterServer.isAttributeSupportedByName(capitalizedAttributeName)) {
    if (log) log.error(`subscribeAttribute error: Attribute ${attribute} not found on Cluster ${clusterServer.name} on endpoint ${endpoint.name}:${endpoint.number}`);
    return false;
  }
  // Find the subscribe method
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(clusterServer as any)[`subscribe${capitalizedAttributeName}Attribute`]) {
    log?.error(
      `subscribeAttribute error: subscribe${capitalizedAttributeName}Attribute not found on Cluster ${clusterServer.name} on endpoint ${endpoint.name}:${endpoint.number}`,
    );
    return false;
  }
  // Subscribe to the attribute
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  const subscribe = (clusterServer as any)[`subscribe${capitalizedAttributeName}Attribute`] as (listener: (newValue: any, oldValue: any) => void) => {};
  subscribe(listener);
  log?.info(`${db}Subscribe endpoint ${or}${endpoint.name}:${endpoint.number}${db} attribute ${hk}${clusterServer.name}.${capitalizedAttributeName}${db}`);
  return true;
}

/*

interface MatterCommandData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any;
  endpoint: Endpoint;
}

function addCommandHandler(clusterId: ClusterId, command: string, handler: (data: MatterCommandData) => void, log?: AnsiLogger, endpoint?: Endpoint): boolean {
  // if (!endpoint) endpoint = this as Endpoint;
  if (!endpoint) return false;

  const clusterServer = endpoint.getClusterServerById(clusterId);
  if (!clusterServer) {
    log?.error(`addCommandHandler error: Cluster ${clusterId} not found on endpoint ${endpoint.name}:${endpoint.number}`);
    return false;
  }
  if (!clusterServer.isCommandSupportedByName(command)) {
    if (log) log.error(`addCommandHandler error: Command ${command} not found on Cluster ${clusterServer.name} on endpoint ${endpoint.name}:${endpoint.number}`);
    return false;
  }
  // Find the command
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commands = (clusterServer as any).commands as object;
  for (const [key, value] of Object.entries(commands)) {
    // console.log(`Key "${key}": ${debugStringify(value)}`);
    if (key === command) {
      value.handler = handler;
      log?.info(`${db}Command handler added for endpoint ${or}${endpoint.name}:${endpoint.number}${db} ${hk}${clusterServer.name}.${command}${db}`);
      return true;
    }
  }
  log?.error(`Command handler not found for endpoint ${or}${endpoint.name}:${endpoint.number}${er} ${hk}${clusterServer.name}.${command}${er}`);
  return false;
}
*/
