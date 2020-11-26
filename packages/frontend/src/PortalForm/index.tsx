import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useSelector } from 'react-redux'

import { Button, FormControl, FormLabel, TextField } from '@material-ui/core'
import DeviceHubIcon from '@material-ui/icons/DeviceHub'

import { DEFAULT_PORTAL_SIZE, DEFAULT_ZONE } from '../common/data/constants'
import useZoneListSelector from '../common/hooks/useZoneListSelector'
import ZoneSearch from '../ZoneSearch'
import { ZoneLight } from '../ZoneSearch/zoneSearchUtils'
import { RootState } from '../reducers'
import { PortalSize, Zone } from '../common/types'
import UserSettings from '../UserSettings'
import PortalSizeSelector from './PortalSizeSelector'
import useAddPortal from './useAddPortal'

import styles from './styles.module.scss'

const MappingBar = () => {
  const fromId = useSelector(
    (state: RootState) => state.portalMap.inspectPortalId
  )

  const oldFromId = useRef<string>(fromId?.toLowerCase() ?? '')
  const [from, setFrom] = useState<ZoneLight>(DEFAULT_ZONE)
  const [to, setTo] = useState<ZoneLight>(DEFAULT_ZONE)
  const [portalSize, setPortalSize] = useState<PortalSize>(DEFAULT_PORTAL_SIZE)
  const [hours, setHours] = useState<number | null>(null)
  const [minutes, setMinutes] = useState<number | null>(null)

  const zones: Zone[] = useZoneListSelector()

  const zoneNames = useMemo<ZoneLight[]>(() => {
    const newZones = zones
      .map((n) => ({ name: n.name, value: n.name.toLowerCase() }))
      .sort((a, b) => a.value.localeCompare(b.value))

    newZones.unshift(DEFAULT_ZONE)

    return newZones
  }, [zones])

  const addPortal = useAddPortal()

  const filteredFrom = useMemo<ZoneLight[]>(
    () => zoneNames.filter((z) => z?.value !== to?.value),
    [to, zoneNames]
  )

  const filteredTo = useMemo<ZoneLight[]>(
    () => zoneNames.filter((z) => z?.value !== from?.value),
    [from, zoneNames]
  )

  useEffect(() => {
    if (fromId && fromId?.toLocaleLowerCase() !== oldFromId.current) {
      setFrom({ name: fromId, value: fromId?.toLowerCase() })
      oldFromId.current = fromId.toLowerCase()
    }
  }, [fromId, setFrom])

  const firstFieldRef = useRef<any>(null) //TODO figure out typing for this, HTMLInputElement is not ok apparently

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      try {
        const hr = Number(hours)
        const min = Number(minutes)

        if (from?.name && to?.name && portalSize && hr + min > 0) {
          addPortal(from.name, to.name, portalSize, hr, min)
          setTo(DEFAULT_ZONE)
          setHours(null)
          setMinutes(null)
          setPortalSize(DEFAULT_PORTAL_SIZE)

          firstFieldRef.current?.focus()
        } else {
          throw new Error('you suck')
        }
      } catch (err) {
        console.error(err)
      }
    },
    [from, to, portalSize, hours, minutes, addPortal]
  )

  return (
    <>
      <form onSubmit={handleSubmit} autoComplete="off">
        <div className={styles.mappingBar}>
          <div className={styles.row}>
            <ZoneSearch
              value={from}
              update={setFrom}
              label="From"
              zoneList={filteredFrom}
              inputRef={firstFieldRef}
            />
          </div>
          <div className={styles.row}>
            <ZoneSearch
              value={to}
              update={setTo}
              label="To"
              zoneList={filteredTo}
            />
          </div>
          <div className={styles.row}>
            <PortalSizeSelector size={portalSize} update={setPortalSize} />
          </div>
          <div className={styles.row}>
            <FormControl fullWidth component="fieldset">
              <FormLabel component="legend">Time Left</FormLabel>
              <div className={styles.flexColumn}>
                <TextField
                  id="time-hour"
                  className={styles.durationField}
                  type="number"
                  label="Hour(s)"
                  InputProps={{
                    inputProps: { min: 0, max: 24 },
                    value: hours ?? '',
                  }}
                  onChange={(e) => setHours(Number(e.currentTarget.value))}
                />
                <TextField
                  id="time-minute"
                  className={styles.durationField}
                  type="number"
                  label="Minute(s)"
                  InputProps={{
                    inputProps: { min: 0, max: 59 },
                    value: minutes ?? '',
                  }}
                  onBlur={(e) =>
                    e.currentTarget.value === '0' ? setMinutes(null) : null
                  }
                  onChange={(e) => setMinutes(Number(e.currentTarget.value))}
                />
              </div>
            </FormControl>
          </div>
          <div className={styles.row}>
            <FormControl fullWidth>
              <Button
                className={styles.createBtn}
                variant="contained"
                color="primary"
                type="submit"
                endIcon={<DeviceHubIcon />}
                size="large"
              >
                Create Connection
              </Button>
            </FormControl>
          </div>
        </div>
      </form>
      <UserSettings zones={zoneNames} />
    </>
  )
}

export default MappingBar
